'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useProject } from '@/lib/context/project-context'
import { 
  Activity, 
  FileText, 
  Users, 
  Package,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'

export default function OverviewPage() {
  const { selectedProject } = useProject()

  const stats = [
    {
      title: 'Content Types',
      value: '12',
      change: '+2 this week',
      icon: <FileText className="h-4 w-4" />,
      trend: 'up'
    },
    {
      title: 'Components',
      value: '48',
      change: '+5 this week',
      icon: <Package className="h-4 w-4" />,
      trend: 'up'
    },
    {
      title: 'Team Members',
      value: '8',
      change: 'No change',
      icon: <Users className="h-4 w-4" />,
      trend: 'neutral'
    },
    {
      title: 'Active Tasks',
      value: '23',
      change: '5 completed today',
      icon: <Activity className="h-4 w-4" />,
      trend: 'up'
    }
  ]

  const recentActivity = [
    {
      id: 1,
      action: 'Created new content type',
      item: 'Blog Post',
      time: '2 hours ago',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 2,
      action: 'Updated component',
      item: 'Hero Section',
      time: '4 hours ago',
      icon: <Package className="h-4 w-4" />
    },
    {
      id: 3,
      action: 'Published content',
      item: 'Getting Started Guide',
      time: '6 hours ago',
      icon: <CheckCircle className="h-4 w-4" />
    }
  ]

  const quickActions = [
    {
      title: 'Create Content Type',
      description: 'Define a new content structure',
      href: '/content-builder',
      icon: <FileText className="h-5 w-5" />
    },
    {
      title: 'Preview Changes',
      description: 'See your changes in real-time',
      href: '/preview',
      icon: <Package className="h-5 w-5" />
    },
    {
      title: 'View Analytics',
      description: 'Track your project metrics',
      href: '/analytics',
      icon: <TrendingUp className="h-5 w-5" />
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          {selectedProject ? `${selectedProject.name} Overview` : 'Project Overview'}
        </h1>
        <p className="text-gray-400 mt-2">
          Welcome back! Here&apos;s what&apos;s happening with your project.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                {stat.title}
              </CardTitle>
              <div className="text-orange-400">{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <p className={`text-xs mt-1 ${
                stat.trend === 'up' ? 'text-green-400' : 
                stat.trend === 'down' ? 'text-red-400' : 
                'text-gray-400'
              }`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-gray-400">
              Latest updates from your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4">
                  <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg">
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">
                      {activity.action}: <span className="font-medium">{activity.item}</span>
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-gray-400">
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant="ghost"
                className="w-full justify-start text-left hover:bg-gray-700/50 group"
                onClick={() => window.location.href = action.href}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-gray-700/50 text-orange-400 rounded-lg group-hover:bg-orange-500/20">
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{action.title}</p>
                    <p className="text-xs text-gray-400">{action.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-orange-400" />
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}