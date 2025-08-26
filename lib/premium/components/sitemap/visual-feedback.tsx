'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSitemapStore } from '../../stores/sitemap-store';

interface ChangedNode {
  id: string;
  type: 'added' | 'updated' | 'deleted';
}

export function useVisualFeedback() {
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const nodes = useSitemapStore(state => state.nodes);
  const [previousNodes, setPreviousNodes] = useState(nodes);
  
  // Detect changes and show feedback
  useEffect(() => {
    if (nodes === previousNodes) return;
    
    const prevNodeMap = new Map(previousNodes.map(n => [n.id, n]));
    const currentNodeMap = new Map(nodes.map(n => [n.id, n]));
    const changes: ChangedNode[] = [];
    
    // Find added/updated nodes
    currentNodeMap.forEach((node, id) => {
      const prevNode = prevNodeMap.get(id);
      if (!prevNode) {
        changes.push({ id, type: 'added' });
      } else if (JSON.stringify(prevNode) !== JSON.stringify(node)) {
        changes.push({ id, type: 'updated' });
      }
    });
    
    // Find deleted nodes
    prevNodeMap.forEach((_, id) => {
      if (!currentNodeMap.has(id)) {
        changes.push({ id, type: 'deleted' });
      }
    });
    
    // Highlight changed nodes
    if (changes.length > 0) {
      const newHighlights = new Set(changes.map(c => c.id));
      setHighlightedNodes(newHighlights);
      
      // Clear highlights after animation
      setTimeout(() => {
        setHighlightedNodes(new Set());
      }, 1500);
      
      // Show toast notification
      const changeTypes = [...new Set(changes.map(c => c.type))];
      const message = changeTypes.length === 1 
        ? `${changes.length} node(s) ${changeTypes[0]}`
        : `${changes.length} node(s) changed`;
      
      toast.info(message, {
        duration: 2000,
        position: 'bottom-center'
      });
    }
    
    setPreviousNodes(nodes);
  }, [nodes, previousNodes]);
  
  return highlightedNodes;
}

/**
 * CSS classes to apply to highlighted nodes
 */
export function getHighlightClass(nodeId: string, highlightedNodes: Set<string>) {
  if (highlightedNodes.has(nodeId)) {
    return 'animate-pulse ring-2 ring-primary ring-offset-2 transition-all duration-300';
  }
  return '';
}