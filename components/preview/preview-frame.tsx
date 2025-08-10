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
import { DesktopFrame } from './device-frames/desktop-frame'
import { TabletFrame } from './device-frames/tablet-frame'
import { MobileFrame } from './device-frames/mobile-frame'

interface PreviewFrameProps {
  className?: string
}

function PreviewFrameComponent({ className }: PreviewFrameProps) {
  const { state, refresh } = usePreviewContext()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  
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

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    const container = document.querySelector('.preview-frame-container')
    if (container) {
      observer.observe(container)
    }

    return () => {
      if (container) {
        observer.unobserve(container)
      }
    }
  }, [])

  // Update iframe content when content changes and is visible
  useEffect(() => {
    if (iframeLoaded && iframeRef.current?.contentWindow && isVisible) {
      const message: PreviewMessage = {
        type: 'UPDATE_CONTENT',
        payload: { content },
        timestamp: Date.now()
      }
      iframeRef.current.contentWindow.postMessage(message, '*')
    }
  }, [content, iframeLoaded, isVisible])

  // Initialize iframe on load
  const handleIframeLoad = useCallback(() => {
    initializeIframe()
    
    // Store ref for context
    if (typeof window !== 'undefined') {
      const win = window as Window & { __previewIframeRef?: { current: HTMLIFrameElement | null } }
      win.__previewIframeRef = { current: iframeRef.current }
    }
  }, [initializeIframe])

  // Device frame styles
  const showFrame = settings.showDeviceFrame

  // Render device-specific frame
  const renderDeviceFrame = (children: React.ReactNode) => {
    if (!showFrame) {
      return <div className="relative w-full h-full">{children}</div>
    }

    switch (activeDevice.type) {
      case 'desktop':
        return <DesktopFrame>{children}</DesktopFrame>
      case 'tablet':
        return <TabletFrame>{children}</TabletFrame>
      case 'mobile':
        return <MobileFrame>{children}</MobileFrame>
      default:
        return <div className="relative w-full h-full">{children}</div>
    }
  }

  return (
    <div className={cn('preview-frame-container relative flex items-center justify-center p-8', className)}>
      {/* Device Frame Wrapper */}
      <div 
        className={cn(
          'relative transition-all duration-300 ease-[cubic-bezier(0.4,0.0,0.2,1)]',
          showFrame && 'device-frame'
        )}
        style={{
          width: showFrame ? scaledWidth + (activeDevice.type === 'desktop' ? 0 : 80) : scaledWidth,
          height: showFrame ? scaledHeight + (activeDevice.type === 'desktop' ? 40 : 120) : scaledHeight,
          transform: `scale(${zoom})`,
          transformOrigin: 'center',
          willChange: 'transform'
        }}
      >
        {renderDeviceFrame(
          <>
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
              className="w-full h-full bg-white"
              style={{
                width: scaledWidth,
                height: scaledHeight,
                border: 'none'
              }}
              title="Website Preview"
              sandbox="allow-scripts"
              onLoad={handleIframeLoad}
            />
          </>
        )}
      </div>
    </div>
  )
}

// Export memoized component for performance
export const PreviewFrame = React.memo(PreviewFrameComponent)