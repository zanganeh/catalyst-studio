'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { QuickCategoryTags } from './quick-category-tags';

interface AIPromptSectionProps {
  onWebsiteCreated: (userPrompt: string) => Promise<void>;
  isCreating: boolean;
}

export function AIPromptSection({ onWebsiteCreated, isCreating }: AIPromptSectionProps) {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  const handleTagClick = (tagPrompt: string) => {
    setPrompt(tagPrompt);
    textareaRef.current?.focus();
  };

  const handleCreate = async () => {
    if (!prompt.trim() || isProcessing || isCreating) return;
    
    setIsProcessing(true);
    try {
      await onWebsiteCreated(prompt);
      setPrompt(''); // Clear prompt on success
    } catch (error) {
      // Error is handled by parent component
      console.error('Failed to create website:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <div className="ai-prompt-container bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl p-8 shadow-lg border border-indigo-100 dark:border-indigo-900/50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            What would you build today?
          </h2>
        </div>
        
        <div className="prompt-input-wrapper space-y-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => {
                // Limit prompt to 1000 characters for reasonable processing
                if (e.target.value.length <= 1000) {
                  setPrompt(e.target.value);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Describe your website idea... (e.g., 'A CRM for small businesses with lead tracking and email automation')"
              className="w-full min-h-[100px] max-h-[200px] p-4 pr-32 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl resize-none 
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                       placeholder:text-gray-400 dark:placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       transition-all duration-200"
              disabled={isProcessing || isCreating}
              aria-label="Website description prompt"
              maxLength={1000}
            />
            
            <button
              onClick={handleCreate}
              disabled={!prompt.trim() || isProcessing || isCreating}
              className="absolute right-3 bottom-3 px-4 py-2 
                       bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700
                       disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed
                       text-white font-medium rounded-lg
                       transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100
                       flex items-center gap-2 shadow-md"
              aria-label="Create website from prompt"
            >
              {(isProcessing || isCreating) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Website</span>
              )}
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Quick start with a template:
              </p>
              <QuickCategoryTags onTagClick={handleTagClick} />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Pro tip: Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> to create
            </p>
            {prompt.length > 800 && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {prompt.length}/1000 characters
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}