import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Keyboard } from 'lucide-react'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

const shortcuts = [
  { category: 'Navigation', items: [
    { keys: ['F'], description: 'Fit view to all nodes' },
    { keys: ['+', '='], description: 'Zoom in' },
    { keys: ['-', '_'], description: 'Zoom out' },
    { keys: ['Arrow Keys'], description: 'Move selected nodes' },
    { keys: ['Shift', 'Arrow Keys'], description: 'Move selected nodes faster' },
    { keys: ['Space', 'Drag'], description: 'Pan canvas' },
  ]},
  { category: 'Selection', items: [
    { keys: ['Click'], description: 'Select node' },
    { keys: ['Ctrl/Cmd', 'Click'], description: 'Multi-select nodes' },
    { keys: ['Ctrl/Cmd', 'A'], description: 'Select all nodes' },
    { keys: ['Esc'], description: 'Deselect all' },
  ]},
  { category: 'Editing', items: [
    { keys: ['N'], description: 'Add new node' },
    { keys: ['Enter'], description: 'Edit selected node' },
    { keys: ['Delete'], description: 'Delete selected nodes' },
    { keys: ['Ctrl/Cmd', 'D'], description: 'Duplicate selected nodes' },
  ]},
  { category: 'Clipboard', items: [
    { keys: ['Ctrl/Cmd', 'C'], description: 'Copy selected nodes' },
    { keys: ['Ctrl/Cmd', 'X'], description: 'Cut selected nodes' },
    { keys: ['Ctrl/Cmd', 'V'], description: 'Paste nodes' },
  ]},
  { category: 'History', items: [
    { keys: ['Ctrl/Cmd', 'Z'], description: 'Undo' },
    { keys: ['Ctrl/Cmd', 'Shift', 'Z'], description: 'Redo' },
    { keys: ['Ctrl/Cmd', 'Y'], description: 'Redo (alternative)' },
  ]},
  { category: 'Layout', items: [
    { keys: ['Ctrl/Cmd', 'Shift', 'A'], description: 'Auto-layout nodes' },
  ]},
]

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-gray-900/95 backdrop-blur-xl border-gray-700 text-white overflow-y-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-[#FF5500]" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Master these shortcuts to work faster in the sitemap builder
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6 mt-6">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && <span className="text-gray-500 text-xs">+</span>}
                          <kbd className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded-md font-mono">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                    <span className="text-sm text-gray-400 ml-4">{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Press <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs">?</kbd> anytime to view this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}