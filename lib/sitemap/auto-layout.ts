import dagre from 'dagre'
import { Node, Edge } from 'reactflow'

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL'
export type LayoutType = 'tree' | 'radial' | 'grid' | 'force'

export function applyAutoLayout(
  nodes: Node[], 
  edges: Edge[], 
  direction: LayoutDirection = 'TB',
  layoutType: LayoutType = 'tree'
) {
  if (layoutType === 'tree') {
    return applyTreeLayout(nodes, edges, direction)
  } else if (layoutType === 'radial') {
    return applyRadialLayout(nodes, edges)
  } else if (layoutType === 'grid') {
    return applyGridLayout(nodes)
  }
  // Default to tree layout
  return applyTreeLayout(nodes, edges, direction)
}

function applyTreeLayout(nodes: Node[], edges: Edge[], direction: LayoutDirection = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  
  const nodeWidth = 320  // Account for enhanced node width
  const nodeHeight = 200 // Account for enhanced node height with sections
  
  // Find the home node to center the layout around it
  const homeNode = nodes.find(n => n.id === 'home' || n.data?.label?.toLowerCase() === 'home')
  
  dagreGraph.setGraph({ 
    rankdir: direction,
    align: homeNode ? 'DL' : 'UL',  // Center alignment when home exists
    nodesep: 50,  // Tight horizontal spacing between siblings
    ranksep: 80,  // Compact vertical spacing between levels
    marginx: 30,
    marginy: 30,
  })
  
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: node.type === 'folder' ? 220 : nodeWidth, 
      height: node.type === 'folder' ? 100 : nodeHeight 
    })
  })
  
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })
  
  dagre.layout(dagreGraph)
  
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    const isHome = node.id === 'home' || node.data?.label?.toLowerCase() === 'home'
    
    // Calculate positions - center the home node
    let x = nodeWithPosition.x - (node.type === 'folder' ? 110 : nodeWidth / 2)
    let y = nodeWithPosition.y - (node.type === 'folder' ? 50 : nodeHeight / 2)
    
    // If this is the home node, ensure it's centered horizontally
    if (isHome && nodes.length > 1) {
      // Find the min and max x positions of children
      const childNodes = edges
        .filter(e => e.source === node.id)
        .map(e => nodes.find(n => n.id === e.target))
        .filter(Boolean)
      
      if (childNodes.length > 0) {
        const childPositions = childNodes.map(child => {
          const childPos = dagreGraph.node(child!.id)
          return childPos.x
        })
        const minX = Math.min(...childPositions)
        const maxX = Math.max(...childPositions)
        x = ((minX + maxX) / 2) - nodeWidth / 2
      }
    }
    
    return {
      ...node,
      position: { x, y },
    }
  })
  
  return layoutedNodes
}

function applyRadialLayout(nodes: Node[], edges: Edge[]) {
  if (nodes.length === 0) return nodes
  
  // Find root node (node with no incoming edges)
  const roots = nodes.filter(node => 
    !edges.some(edge => edge.target === node.id)
  )
  const root = roots[0] || nodes[0]
  
  // Build adjacency list
  const adjacencyList = new Map<string, string[]>()
  edges.forEach(edge => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, [])
    }
    adjacencyList.get(edge.source)!.push(edge.target)
  })
  
  // Calculate levels using BFS
  const levels = new Map<string, number>()
  const queue = [{ id: root.id, level: 0 }]
  const visited = new Set<string>()
  
  while (queue.length > 0) {
    const { id, level } = queue.shift()!
    if (visited.has(id)) continue
    
    visited.add(id)
    levels.set(id, level)
    
    const children = adjacencyList.get(id) || []
    children.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push({ id: childId, level: level + 1 })
      }
    })
  }
  
  // Group nodes by level
  const nodesByLevel = new Map<number, Node[]>()
  nodes.forEach(node => {
    const level = levels.get(node.id) || 0
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, [])
    }
    nodesByLevel.get(level)!.push(node)
  })
  
  // Position nodes in concentric circles
  const centerX = 600
  const centerY = 400
  const radiusStep = 200
  
  const layoutedNodes = nodes.map(node => {
    const level = levels.get(node.id) || 0
    const nodesAtLevel = nodesByLevel.get(level) || []
    const index = nodesAtLevel.findIndex(n => n.id === node.id)
    
    if (level === 0) {
      // Root at center
      return {
        ...node,
        position: { x: centerX, y: centerY }
      }
    }
    
    const radius = level * radiusStep
    const angleStep = (2 * Math.PI) / nodesAtLevel.length
    const angle = index * angleStep
    
    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      }
    }
  })
  
  return layoutedNodes
}

function applyGridLayout(nodes: Node[]) {
  const columns = Math.ceil(Math.sqrt(nodes.length))
  const nodeWidth = 320
  const nodeHeight = 150
  const gapX = 40
  const gapY = 40
  
  return nodes.map((node, index) => {
    const row = Math.floor(index / columns)
    const col = index % columns
    
    return {
      ...node,
      position: {
        x: col * (nodeWidth + gapX) + 100,
        y: row * (nodeHeight + gapY) + 100
      }
    }
  })
}

export function transformSitemapToFlow(sitemapNodes: any[]): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  
  const processNode = (node: any, parentId?: string) => {
    const flowNode: Node = {
      id: node.id,
      type: node.type || 'page',
      position: node.position || { x: 0, y: 0 },
      data: {
        label: node.title || node.label,
        url: node.url,
        sections: node.sections?.map((s: any) => 
          typeof s === 'string' ? s : s.title
        ),
        description: node.description,
        expanded: node.expanded,
        color: node.color,
      },
    }
    
    nodes.push(flowNode)
    
    if (parentId) {
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: 'rgba(255, 255, 255, 0.2)',
          strokeWidth: 2,
        },
      })
    }
    
    if (node.children && node.children.length > 0) {
      node.children.forEach((child: any) => {
        processNode(child, node.id)
      })
    }
  }
  
  sitemapNodes.forEach((node) => {
    processNode(node)
  })
  
  return { nodes, edges }
}

export function parseImportedData(data: any): { nodes: Node[], edges: Edge[] } {
  // If data already has nodes and edges in React Flow format
  if (data.nodes && data.edges) {
    return data
  }
  
  // If data is in hierarchical format (like our existing sitemap)
  if (Array.isArray(data)) {
    return transformSitemapToFlow(data)
  }
  
  // If data is a single root node with children
  if (data.children) {
    return transformSitemapToFlow([data])
  }
  
  // Fallback: create a single node
  return {
    nodes: [{
      id: 'imported-1',
      type: 'page',
      position: { x: 400, y: 200 },
      data: {
        label: 'Imported Page',
        ...data
      }
    }],
    edges: []
  }
}