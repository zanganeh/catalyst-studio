import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Node, Edge } from 'reactflow';
import { saveManager, SaveStatus } from '../components/sitemap/save-manager';
import { transformFromReactFlow } from '../components/sitemap/transforms/from-react-flow';
import { SitemapNode, SitemapEdge } from '../components/sitemap/types';

interface SitemapState {
  // Data
  nodes: SitemapNode[];
  edges: SitemapEdge[];
  websiteId: string | null;
  
  // UI State
  selectedNodes: string[];
  saveStatus: SaveStatus;
  isLoading: boolean;
  errorState: { message: string; retry?: () => void } | null;
  
  // History for undo/redo (added later)
  history: Array<{ nodes: SitemapNode[]; edges: SitemapEdge[] }>;
  historyIndex: number;
  previousNodes: SitemapNode[];
  previousEdges: SitemapEdge[];
  
  // Actions
  loadStructure: (websiteId: string) => Promise<void>;
  addNode: (parentId: string | null, data: any) => void;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  deleteNodes: (nodeIds: string[]) => void;
  moveNode: (nodeId: string, newParentId: string | null) => void;
  
  // Selection
  setSelectedNodes: (nodeIds: string[]) => void;
  clearSelection: () => void;
  
  // React Flow handlers
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onConnect: (connection: any) => void;
  
  // Save management
  setSaveStatus: (status: SaveStatus) => void;
  setError: (error: { message: string; retry?: () => void } | null) => void;
  
  // History management
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Optimistic updates
  optimisticUpdate: <T>(
    action: () => Promise<T>,
    rollback: () => void
  ) => Promise<T>;
}

export const useSitemapStore = create<SitemapState>()(
  immer((set, get) => ({
    // Initial state
    nodes: [],
    edges: [],
    websiteId: null,
    selectedNodes: [],
    saveStatus: 'idle',
    isLoading: false,
    errorState: null,
    history: [],
    historyIndex: -1,
    previousNodes: [],
    previousEdges: [],
    
    // Load structure from API
    loadStructure: async (websiteId: string) => {
      set((state) => {
        state.isLoading = true;
        state.errorState = null;
        state.websiteId = websiteId;
      });
      
      try {
        const response = await fetch(`/api/premium/sitemap/${websiteId}`);
        if (!response.ok) {
          throw new Error('Failed to load sitemap');
        }
        
        const data = await response.json();
        
        set((state) => {
          state.nodes = data.nodes || [];
          state.edges = data.edges || [];
          state.previousNodes = data.nodes || [];
          state.previousEdges = data.edges || [];
          state.isLoading = false;
          // Initialize history with loaded state
          state.history = [{ nodes: data.nodes || [], edges: data.edges || [] }];
          state.historyIndex = 0;
        });
        
        // Initialize save manager
        saveManager.initialize(websiteId, {
          onStatusChange: (status) => get().setSaveStatus(status),
          onError: (error) => get().setError({
            message: error.message,
            retry: () => saveManager.retry()
          })
        });
        
      } catch (error) {
        set((state) => {
          state.isLoading = false;
          state.errorState = {
            message: error instanceof Error ? error.message : 'Failed to load sitemap',
            retry: () => get().loadStructure(websiteId)
          };
        });
      }
    },
    
    // Add a new node
    addNode: (parentId, data) => {
      const newNode: SitemapNode = {
        id: `node-${Date.now()}`, // Temporary ID, will be replaced by server
        type: data.type || 'page',
        position: { x: 0, y: 0 },
        data: {
          label: data.title || 'New Page',
          slug: data.slug || 'new-page',
          components: [],
          childCount: 0,
          hasContent: data.type === 'page',
          contentTypeCategory: data.type
        }
      };
      
      set((state) => {
        state.nodes.push(newNode);
        
        if (parentId) {
          state.edges.push({
            id: `${parentId}-${newNode.id}`,
            source: parentId,
            target: newNode.id,
            type: 'smoothstep'
          });
        }
      });
      
      const state = get();
      const operations = transformFromReactFlow(
        state.nodes, 
        state.edges, 
        state.previousNodes, 
        state.previousEdges
      );
      
      // Update previous state for next diff
      set((s) => {
        s.previousNodes = [...state.nodes];
        s.previousEdges = [...state.edges];
      });
      
      state.pushHistory();
      saveManager.addOperations(operations);
    },
    
    // Update a node
    updateNode: (nodeId, updates) => {
      set((state) => {
        const nodeIndex = state.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex >= 0) {
          Object.assign(state.nodes[nodeIndex], updates);
        }
      });
      
      const state = get();
      const operations = transformFromReactFlow(
        state.nodes, 
        state.edges, 
        state.previousNodes, 
        state.previousEdges
      );
      
      // Update previous state for next diff
      set((s) => {
        s.previousNodes = [...state.nodes];
        s.previousEdges = [...state.edges];
      });
      
      state.pushHistory();
      saveManager.addOperations(operations);
    },
    
    // Delete nodes
    deleteNodes: (nodeIds) => {
      set((state) => {
        // Remove nodes
        state.nodes = state.nodes.filter(n => !nodeIds.includes(n.id));
        
        // Remove related edges
        state.edges = state.edges.filter(
          e => !nodeIds.includes(e.source) && !nodeIds.includes(e.target)
        );
        
        // Clear selection if deleted nodes were selected
        state.selectedNodes = state.selectedNodes.filter(id => !nodeIds.includes(id));
      });
      
      get().pushHistory();
      
      // Generate delete operations
      const operations = nodeIds.map(nodeId => ({
        type: 'DELETE' as const,
        nodeId
      }));
      saveManager.addOperations(operations);
    },
    
    // Move a node to a new parent
    moveNode: (nodeId, newParentId) => {
      set((state) => {
        // Remove old parent edge
        state.edges = state.edges.filter(e => e.target !== nodeId);
        
        // Add new parent edge
        if (newParentId) {
          state.edges.push({
            id: `${newParentId}-${nodeId}`,
            source: newParentId,
            target: nodeId,
            type: 'smoothstep'
          });
        }
      });
      
      get().pushHistory();
      
      // Generate move operation
      saveManager.addOperation({
        type: 'MOVE',
        nodeId,
        newParentId
      });
    },
    
    // Selection management
    setSelectedNodes: (nodeIds) => set((state) => {
      state.selectedNodes = nodeIds;
    }),
    
    clearSelection: () => set((state) => {
      state.selectedNodes = [];
    }),
    
    // React Flow change handlers
    onNodesChange: (changes) => {
      set((state) => {
        // Apply React Flow changes
        changes.forEach((change: any) => {
          if (change.type === 'position' && change.dragging === false) {
            const node = state.nodes.find(n => n.id === change.id);
            if (node) {
              node.position = change.position;
            }
          }
          if (change.type === 'select') {
            if (change.selected) {
              if (!state.selectedNodes.includes(change.id)) {
                state.selectedNodes.push(change.id);
              }
            } else {
              state.selectedNodes = state.selectedNodes.filter(id => id !== change.id);
            }
          }
        });
      });
    },
    
    onEdgesChange: (changes) => {
      set((state) => {
        // Apply React Flow edge changes
        changes.forEach((change: any) => {
          if (change.type === 'remove') {
            state.edges = state.edges.filter(e => e.id !== change.id);
          }
        });
      });
    },
    
    onConnect: (connection) => {
      set((state) => {
        // Add new connection
        state.edges.push({
          id: `${connection.source}-${connection.target}`,
          source: connection.source,
          target: connection.target,
          type: 'smoothstep'
        });
      });
      
      // Save the new connection
      saveManager.addOperation({
        type: 'MOVE',
        nodeId: connection.target,
        newParentId: connection.source
      });
    },
    
    // Save status management
    setSaveStatus: (status) => set((state) => {
      state.saveStatus = status;
    }),
    
    setError: (error) => set((state) => {
      state.errorState = error;
    }),
    
    // History management
    pushHistory: () => {
      const currentState = {
        nodes: [...get().nodes],
        edges: [...get().edges]
      };
      
      set((state) => {
        // Remove any history after current index
        state.history = state.history.slice(0, state.historyIndex + 1);
        
        // Add new state
        state.history.push(currentState);
        state.historyIndex++;
        
        // Limit history to 50 states
        if (state.history.length > 50) {
          state.history.shift();
          state.historyIndex--;
        }
      });
    },
    
    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        const previousState = history[historyIndex - 1];
        set((state) => {
          state.nodes = [...previousState.nodes];
          state.edges = [...previousState.edges];
          state.historyIndex--;
        });
      }
    },
    
    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const nextState = history[historyIndex + 1];
        set((state) => {
          state.nodes = [...nextState.nodes];
          state.edges = [...nextState.edges];
          state.historyIndex++;
        });
      }
    },
    
    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,
    
    // Optimistic updates
    optimisticUpdate: async (action, rollback) => {
      const snapshot = {
        nodes: [...get().nodes],
        edges: [...get().edges]
      };
      
      try {
        const result = await action();
        return result;
      } catch (error) {
        // Rollback on error
        set((state) => {
          state.nodes = snapshot.nodes;
          state.edges = snapshot.edges;
        });
        rollback();
        throw error;
      }
    }
  }))
);