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
    <div className="ai-prompt-container bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-700">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-8 h-8 text-catalyst-orange" />
          <h2 className="text-3xl font-bold text-white">
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
              className="w-full min-h-[100px] max-h-[200px] p-4 pr-32 border-2 border-gray-700 rounded-xl resize-none 
                       bg-gray-800 text-gray-100
                       placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-catalyst-orange focus:border-transparent
                       transition-all duration-200"
              disabled={isProcessing || isCreating}
              aria-label="Website description prompt"
              maxLength={1000}
            />
            
            <button
              onClick={handleCreate}
              disabled={!prompt.trim() || isProcessing || isCreating}
              className="absolute right-3 bottom-3 px-4 py-2 
                       bg-catalyst-orange hover:bg-catalyst-orange-dark
                       disabled:bg-gray-600 disabled:cursor-not-allowed
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
              <p className="text-sm text-gray-400 mb-2">
                Quick start with a template:
              </p>
              <QuickCategoryTags onTagClick={handleTagClick} />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Pro tip: Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-700 rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-gray-700 rounded">Enter</kbd> to create
            </p>
            {prompt.length > 800 && (
              <p className="text-xs text-gray-500">
                {prompt.length}/1000 characters
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}