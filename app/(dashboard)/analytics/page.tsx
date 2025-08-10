'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Calendar, Info } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-2">
          Track and analyze your project performance
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="catalyst-card">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="p-4 bg-orange-500/10 rounded-full mb-4">
            <BarChart3 className="h-12 w-12 text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Analytics Coming Soon</h2>
          <p className="text-gray-400 text-center max-w-md">
            We&apos;re working on powerful analytics features to help you track content performance, 
            user engagement, and system metrics. Stay tuned!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full max-w-2xl">
            <Card className="catalyst-card-dark">
              <CardHeader className="pb-3">
                <TrendingUp className="h-8 w-8 text-orange-400 mb-2" />
                <CardTitle className="text-sm text-white">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-400">
                  Track page views, load times, and user interactions
                </p>
              </CardContent>
            </Card>
            
            <Card className="catalyst-card-dark">
              <CardHeader className="pb-3">
                <Calendar className="h-8 w-8 text-orange-400 mb-2" />
                <CardTitle className="text-sm text-white">Content Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-400">
                  Monitor content creation and publishing patterns
                </p>
              </CardContent>
            </Card>
            
            <Card className="catalyst-card-dark">
              <CardHeader className="pb-3">
                <Info className="h-8 w-8 text-orange-400 mb-2" />
                <CardTitle className="text-sm text-white">Custom Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-400">
                  Create tailored reports for your specific needs
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}