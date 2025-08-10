'use client'

/**
 * Preview Frame Component
 * Story 1.4: Main preview component with iframe isolation
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { usePreviewContext } from '@/lib/context/preview-context'
import { cn } from '@/lib/utils'
import { PreviewMessage } from '@/lib/preview/types'
import { Loader2 } from 'lucide-react'

interface PreviewFrameProps {
  className?: string
}

export function PreviewFrame({ className }: PreviewFrameProps) {
  const { state, refresh } = usePreviewContext()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  
  const { activeDevice, content, zoom, settings, isLoading, error } = state

  // Calculate scaled dimensions
  const scaledWidth = activeDevice.width * activeDevice.scale * zoom
  const scaledHeight = activeDevice.height * activeDevice.scale * zoom

  // Initialize iframe content
  const initializeIframe = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return

    try {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document
      
      // Base HTML template with security headers
      const baseHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              line-height: 1.5;
              color: #212121;
              background: white;
            }
            /* Responsive container */
            .preview-container {
              width: 100%;
              min-height: 100vh;
              position: relative;
            }
            /* Error state */
            .error-state {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              color: #ef4444;
              font-size: 14px;
              padding: 20px;
              text-align: center;
            }
            /* Loading state */
            .loading-state {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              color: #6b7280;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            .spinner {
              width: 24px;
              height: 24px;
              border: 2px solid #e5e7eb;
              border-top-color: #FF5500;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
            }
          </style>
          <script>
            // Message handler for parent communication
            window.addEventListener('message', function(event) {
              // Handle messages from parent
              if (event.data && event.data.type) {
                switch(event.data.type) {
                  case 'UPDATE_CONTENT':
                    if (event.data.payload.content) {
                      document.querySelector('.preview-container').innerHTML = event.data.payload.content;
                    }
                    if (event.data.payload.styles) {
                      const styleEl = document.getElementById('custom-styles');
                      if (styleEl) {
                        styleEl.textContent = event.data.payload.styles;
                      }
                    }
                    // Send confirmation
                    parent.postMessage({
                      type: 'LOADED',
                      payload: { status: 'content updated' },
                      timestamp: Date.now()
                    }, '*');
                    break;
                  case 'REFRESH':
                    location.reload();
                    break;
                  case 'NAVIGATE':
                    // Handle navigation if needed
                    parent.postMessage({
                      type: 'NAVIGATION',
                      payload: { currentPage: event.data.payload.page },
                      timestamp: Date.now()
                    }, '*');
                    break;
                }
              }
            });
            
            // Send ready message when loaded
            window.addEventListener('load', function() {
              parent.postMessage({
                type: 'READY',
                payload: { status: 'iframe ready' },
                timestamp: Date.now()
              }, '*');
            });
            
            // Error handling
            window.addEventListener('error', function(event) {
              parent.postMessage({
                type: 'ERROR',
                payload: { error: event.message },
                timestamp: Date.now()
              }, '*');
            });
          </script>
          <style id="custom-styles"></style>
        </head>
        <body>
          <div class="preview-container">
            ${content || '<div class="loading-state"><div class="spinner"></div></div>'}
          </div>
        </body>
        </html>
      `

      iframeDoc.open()
      iframeDoc.write(baseHTML)
      iframeDoc.close()
      
      setIframeLoaded(true)
    } catch (err) {
      console.error('Failed to initialize iframe:', err)
    }
  }, [content])

  // Update iframe content when content changes
  useEffect(() => {
    if (iframeLoaded && iframeRef.current?.contentWindow) {
      const message: PreviewMessage = {
        type: 'UPDATE_CONTENT',
        payload: { content },
        timestamp: Date.now()
      }
      iframeRef.current.contentWindow.postMessage(message, '*')
    }
  }, [content, iframeLoaded])

  // Initialize iframe on load
  const handleIframeLoad = useCallback(() => {
    initializeIframe()
    
    // Store ref for context
    if (typeof window !== 'undefined') {
      (window as any).__previewIframeRef = { current: iframeRef.current }
    }
  }, [initializeIframe])

  // Device frame styles
  const frameStyles = activeDevice.frame
  const showFrame = settings.showDeviceFrame

  return (
    <div className={cn('preview-frame-container relative flex items-center justify-center p-8', className)}>
      {/* Device Frame Wrapper */}
      <div 
        className={cn(
          'relative transition-all duration-300 ease-in-out',
          showFrame && 'device-frame'
        )}
        style={{
          width: showFrame ? scaledWidth + 40 : scaledWidth,
          height: showFrame ? scaledHeight + 40 : scaledHeight,
          transform: `scale(${zoom})`,
          transformOrigin: 'center'
        }}
      >
        {/* Device Frame */}
        {showFrame && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: frameStyles?.borderRadius,
              border: `${frameStyles?.borderWidth} solid ${frameStyles?.borderColor}`,
              backgroundColor: frameStyles?.backgroundColor,
              boxShadow: frameStyles?.boxShadow,
              padding: frameStyles?.padding
            }}
          >
            {/* Notch for mobile devices */}
            {frameStyles?.hasNotch && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl" />
            )}
            
            {/* Home button for older devices */}
            {frameStyles?.hasHomeButton && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-12 border-2 border-gray-400 rounded-full" />
            )}
            
            {/* Browser chrome for desktop */}
            {frameStyles?.hasBrowserChrome && (
              <div className="absolute -top-8 left-0 right-0 h-8 bg-gray-100 rounded-t-lg flex items-center px-3 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4 h-5 bg-white rounded px-2 text-xs text-gray-500 flex items-center">
                  localhost:3000
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF5500]" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 bg-white flex items-center justify-center z-10 rounded-lg">
            <div className="text-center p-4">
              <p className="text-red-500 font-medium">Preview Error</p>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
              <button
                onClick={refresh}
                className="mt-4 px-4 py-2 bg-[#FF5500] text-white rounded-lg hover:bg-[#FF5500]/90 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Preview iframe */}
        <iframe
          ref={iframeRef}
          className="w-full h-full bg-white rounded-lg"
          style={{
            width: scaledWidth,
            height: scaledHeight,
            border: 'none',
            borderRadius: showFrame ? '0' : '8px',
            boxShadow: showFrame ? 'none' : '0 10px 15px -3px rgb(0 0 0 / 0.1)'
          }}
          title="Website Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  )
}