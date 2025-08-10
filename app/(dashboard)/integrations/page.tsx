'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Cloud, Webhook, Shield, Zap } from 'lucide-react'

export default function IntegrationsPage() {
  const integrations = [
    {
      title: 'Contentful',
      description: 'Headless CMS for digital content',
      icon: <Database className="h-5 w-5" />,
      status: 'Coming in Story 1.10',
      category: 'CMS'
    },
    {
      title: 'Strapi',
      description: 'Open-source headless CMS',
      icon: <Database className="h-5 w-5" />,
      status: 'Coming in Story 1.10',
      category: 'CMS'
    },
    {
      title: 'Sanity',
      description: 'Structured content platform',
      icon: <Database className="h-5 w-5" />,
      status: 'Coming in Story 1.10',
      category: 'CMS'
    },
    {
      title: 'API Webhooks',
      description: 'Custom webhook integrations',
      icon: <Webhook className="h-5 w-5" />,
      status: 'Future Enhancement',
      category: 'API'
    },
    {
      title: 'Cloud Storage',
      description: 'AWS S3, Google Cloud Storage',
      icon: <Cloud className="h-5 w-5" />,
      status: 'Future Enhancement',
      category: 'Storage'
    },
    {
      title: 'Authentication',
      description: 'OAuth, SAML, SSO providers',
      icon: <Shield className="h-5 w-5" />,
      status: 'Future Enhancement',
      category: 'Security'
    }
  ]

  const categories = [...new Set(integrations.map(i => i.category))]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Integrations</h1>
        <p className="text-gray-400 mt-2">
          Connect Catalyst Studio with your favorite tools and services
        </p>
      </div>

      {/* CMS Integration Notice */}
      <Card className="catalyst-card bg-catalyst-orange-light border-catalyst-orange">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-400" />
            <CardTitle className="text-white">CMS Integration Coming Soon</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300">
            Story 1.10 will introduce seamless integration with popular headless CMS platforms, 
            allowing you to sync content types, manage data, and streamline your workflow.
          </p>
        </CardContent>
      </Card>

      {/* Integration Categories */}
      {categories.map(category => (
        <div key={category}>
          <h2 className="text-xl font-semibold text-white mb-4">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations
              .filter(i => i.category === category)
              .map(integration => (
                <Card key={integration.title} className="catalyst-card">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg">
                        {integration.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-white text-base">
                          {integration.title}
                        </CardTitle>
                        <CardDescription className="text-gray-400 text-sm mt-1">
                          {integration.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{integration.status}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="border-gray-600 text-gray-400"
                      >
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}