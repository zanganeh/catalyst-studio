'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, User, Bell, Shield, Palette, Database } from 'lucide-react';

export default function SettingsPage() {
  const settingSections = [
    {
      title: 'Account',
      description: 'Manage your account settings and preferences',
      icon: <User className="h-5 w-5" />,
      items: ['Profile', 'Email', 'Password']
    },
    {
      title: 'Notifications',
      description: 'Configure how you receive notifications',
      icon: <Bell className="h-5 w-5" />,
      items: ['Email notifications', 'Push notifications', 'Activity alerts']
    },
    {
      title: 'Privacy & Security',
      description: 'Control your privacy and security settings',
      icon: <Shield className="h-5 w-5" />,
      items: ['Two-factor authentication', 'API keys', 'Sessions']
    },
    {
      title: 'Appearance',
      description: 'Customize the look and feel',
      icon: <Palette className="h-5 w-5" />,
      items: ['Theme', 'Layout', 'Accessibility']
    },
    {
      title: 'Data & Storage',
      description: 'Manage your data and storage usage',
      icon: <Database className="h-5 w-5" />,
      items: ['Export data', 'Import data', 'Storage usage']
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingSections.map((section) => (
          <Card key={section.title} className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg">
                  {section.icon}
                </div>
                <div>
                  <CardTitle className="text-white">{section.title}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {section.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <Button
                    key={item}
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50"
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:text-white">
            Reset to Defaults
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}