'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { Breadcrumb } from '@/components/navigation/breadcrumb'
import { useFeatureFlags } from '@/contexts/feature-flag-context'

const pageVariants = {
  initial: { 
    opacity: 0, 
    x: -20 
  },
  in: { 
    opacity: 1, 
    x: 0 
  },
  out: { 
    opacity: 0, 
    x: 20 
  }
}

const pageTransition = {
  type: 'tween' as const,
  ease: 'anticipate' as const,
  duration: 0.3
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { isEnabled: isFeatureEnabled } = useFeatureFlags()
  
  // Route guards for feature-flagged views
  React.useEffect(() => {
    // Check if analytics view requires feature flag (future implementation)
    if (pathname.startsWith('/analytics') && !isFeatureEnabled('analytics')) {
      // For now, analytics is always accessible as a placeholder
    }
    
    // Check if development view requires feature flag (future implementation)
    if (pathname.startsWith('/development') && !isFeatureEnabled('sourceCodeView')) {
      // For now, development is always accessible as a placeholder
    }
    
    // Check if integrations view requires feature flag (future implementation)
    if (pathname.startsWith('/integrations') && !isFeatureEnabled('cmsIntegration')) {
      // For now, integrations is always accessible as a placeholder
    }
  }, [pathname, isFeatureEnabled])
  
  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <div className="px-6 py-3 border-b border-gray-700">
        <Breadcrumb />
      </div>
      
      {/* Animated Page Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="flex-1 overflow-y-auto"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}