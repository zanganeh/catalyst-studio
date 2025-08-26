import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Node, Edge, NodeChange, EdgeChange, Connection } from 'reactflow';
import { saveManager, SaveStatus } from '../components/sitemap/save-manager';
import { transformFromReactFlow } from '../components/sitemap/transforms/from-react-flow';
import { SitemapNode, SitemapEdge, CreateNodeData } from '../components/sitemap/types';
import { ContentTypeCategory } from '@/lib/generated/prisma';
import { undoManager } from '../components/sitemap/undo-manager';

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
  
  // Undo/Redo state
  canUndo: boolean;
  canRedo: boolean;
  isUndoRedoInProgress: boolean;
  previousNodes: SitemapNode[];
  previousEdges: SitemapEdge[];
  
  // Actions
  loadStructure: (websiteId: string) => Promise<void>;
  addNode: (parentId: string | null, data: CreateNodeData) => void;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  deleteNodes: (nodeIds: string[]) => void;
  moveNode: (nodeId: string, newParentId: string | null) => void;
  
  // Selection
  setSelectedNodes: (nodeIds: string[]) => void;
  clearSelection: () => void;
  
  // React Flow handlers
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // Save management
  setSaveStatus: (status: SaveStatus) => void;
  setError: (error: { message: string; retry?: () => void } | null) => void;
  
  // History management
  captureState: () => void;
  undo: () => void;
  redo: () => void;
  
  // Optimistic updates
  optimisticUpdate: <T>(
    action: () => Promise<T>,
    rollback: () => void
  ) => Promise<T>;
}

// Initialize undoManager with state change callback
undoManager.onStateChange = (canUndo: boolean, canRedo: boolean) => {
  useSitemapStore.setState({ canUndo, canRedo });
};

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
    canUndo: false,
    canRedo: false,
    isUndoRedoInProgress: false,
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
        });
        
        // Initialize undoManager with loaded state
        undoManager.initialize(data.nodes || [], data.edges || []);
        
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
      const nodeType = 'page'; // Default type for new nodes
      const newNode: SitemapNode = {
        id: `node-${Date.now()}`, // Temporary ID, will be replaced by server
        type: nodeType,
        position: { x: 0, y: 0 },
        data: {
          label: data.title || 'New Page',
          slug: data.slug || 'new-page',
          components: [],
          childCount: 0,
          hasContent: true, // Pages have content
          contentTypeCategory: 'page' as ContentTypeCategory
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
      
      // Capture state for undo/redo
      state.captureState();
      
      // Only save if not during undo/redo
      if (!state.isUndoRedoInProgress) {
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
        
        saveManager.addOperations(operations);
      }
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
      
      // Capture state for undo/redo
      state.captureState();
      
      // Only save if not during undo/redo
      if (!state.isUndoRedoInProgress) {
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
        
        saveManager.addOperations(operations);
      }
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
      
      // Capture state for undo/redo
      get().captureState();
      
      // Only save if not during undo/redo
      if (!get().isUndoRedoInProgress) {
        // Generate delete operations
        const operations = nodeIds.map(nodeId => ({
          type: 'DELETE' as const,
          nodeId
        }));
        saveManager.addOperations(operations);
      }
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
      
      // Capture state for undo/redo
      get().captureState();
      
      // Only save if not during undo/redo
      if (!get().isUndoRedoInProgress) {
        // Generate move operation
        saveManager.addOperation({
          type: 'MOVE',
          nodeId,
          newParentId: newParentId === null ? undefined : newParentId
        });
      }
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
        changes.forEach((change) => {
          if (change.type === 'position' && 'dragging' in change && change.dragging === false) {
            const node = state.nodes.find(n => n.id === change.id);
            if (node && 'position' in change) {
              node.position = change.position!;
            }
          }
          if (change.type === 'select' && 'selected' in change) {
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
        changes.forEach((change) => {
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
          source: connection.source || '',
          target: connection.target || '',
          type: 'smoothstep'
        });
      });
      
      // Save the new connection
      saveManager.addOperation({
        type: 'MOVE',
        nodeId: connection.target || '',
        newParentId: connection.source === null ? undefined : connection.source
      });
    },
    
    // Save status management
    setSaveStatus: (status) => set((state) => {
      state.saveStatus = status;
    }),
    
    setError: (error) => set((state) => {
      state.errorState = error;
    }),
    
    // History management with UndoManager
    captureState: () => {
      const { nodes, edges } = get();
      undoManager.pushState(nodes, edges);
    },
    
    undo: () => {
      set((state) => {
        state.isUndoRedoInProgress = true;
      });
      
      const historyState = undoManager.undo();
      if (historyState) {
        set((state) => {
          state.nodes = historyState.nodes;
          state.edges = historyState.edges;
          // Update previousNodes/edges for proper diff calculation
          state.previousNodes = [...historyState.nodes];
          state.previousEdges = [...historyState.edges];
        });
      }
      
      set((state) => {
        state.isUndoRedoInProgress = false;
      });
    },
    
    redo: () => {
      set((state) => {
        state.isUndoRedoInProgress = true;
      });
      
      const historyState = undoManager.redo();
      if (historyState) {
        set((state) => {
          state.nodes = historyState.nodes;
          state.edges = historyState.edges;
          // Update previousNodes/edges for proper diff calculation
          state.previousNodes = [...historyState.nodes];
          state.previousEdges = [...historyState.edges];
        });
      }
      
      set((state) => {
        state.isUndoRedoInProgress = false;
      });
    },
    
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