'use client'

/**
 * Preview Error Boundary
 * Story 1.4: Error isolation for preview components
 */

import React, { Component, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class PreviewErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Preview Error Boundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-gray-50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Preview Error
          </h2>
          <p className="text-sm text-gray-600 text-center mb-4 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred in the preview'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-[#FF5500] text-white rounded-lg hover:bg-[#FF5500]/90 transition-colors"
          >
            Reset Preview
          </button>
        </div>
      )
    }

    return this.props.children
  }
}