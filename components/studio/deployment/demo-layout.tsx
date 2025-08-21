'use client'

import { ReactNode } from 'react'
import { Hexagon } from 'lucide-react'

interface DemoLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export function DemoLayout({ children, title, subtitle }: DemoLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="flex-1 p-4 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-4">
          {/* Header with Branding */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Hexagon className="h-8 w-8 text-[#FF5500] fill-[#FF5500]/20" />
                <div>
                  <h1 className="text-xl font-bold text-white">Catalyst Studio</h1>
                  <p className="text-xs text-white/60">by CatalystX</p>
                </div>
              </div>
            </div>
            <div className="text-center flex-1">
              <h2 className="text-xl font-semibold text-white">{title}</h2>
              {subtitle && <p className="text-white/60 text-xs">{subtitle}</p>}
            </div>
            <div className="w-32"></div>
          </div>

          {/* Main Content */}
          {children}

          {/* Version Badge - Bottom Right */}
          <div className="absolute bottom-4 right-4">
            <div className="rounded-lg bg-black/40 backdrop-blur-md border border-white/10 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-white/60">Version</span>
                <span className="text-xs font-mono text-white">2.4.0</span>
                <span className="text-xs text-white/40">|</span>
                <span className="text-xs text-[#FF5500]">Enterprise</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}