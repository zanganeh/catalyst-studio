'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useFeatureFlags } from '@/contexts/feature-flag-context';
import { NavigationSection } from './navigation-section';
import { NavigationSection as NavigationSectionType, NavigationItem } from '@/lib/navigation/types';
import {
  MessageSquare,
  Settings,
  Home,
  Database,
  Package,
  Eye,
  BarChart3,
  Code2,
  Plug2,
  FolderOpen,
  Grid3x3,
} from 'lucide-react';

export const NavigationSidebar = React.memo(function NavigationSidebar() {
  const pathname = usePathname();
  const { isEnabled: isFeatureEnabled } = useFeatureFlags();

  // Define navigation sections with expandable items
  const navigationSections: NavigationSectionType[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Home className="h-4 w-4" />,
      expanded: false,
      items: [
        {
          label: 'Dashboard',
          href: '/overview',
          icon: <Grid3x3 className="h-4 w-4" />,
        },
        {
          label: 'Chat',
          href: '/chat',
          icon: <MessageSquare className="h-4 w-4" />,
        },
      ]
    },
    {
      id: 'content',
      label: 'Content',
      icon: <Database className="h-4 w-4" />,
      expanded: false,
      items: [
        {
          label: 'Content Types',
          href: '/content',
          icon: <FolderOpen className="h-4 w-4" />,
        },
        {
          label: 'Content Builder',
          href: '/content-builder',
          icon: <Database className="h-4 w-4" />,
          featureFlag: 'contentTypeBuilder',
        },
        {
          label: 'Preview',
          href: '/preview',
          icon: <Eye className="h-4 w-4" />,
          featureFlag: 'previewSystem',
        },
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      expanded: false,
      items: [
        {
          label: 'Overview',
          href: '/analytics',
          icon: <BarChart3 className="h-4 w-4" />,
        },
      ]
    },
    {
      id: 'development',
      label: 'Development',
      icon: <Code2 className="h-4 w-4" />,
      expanded: false,
      items: [
        {
          label: 'Source Code',
          href: '/development',
          icon: <Code2 className="h-4 w-4" />,
        },
        {
          label: 'Components',
          href: '/components',
          icon: <Package className="h-4 w-4" />,
        },
      ]
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: <Plug2 className="h-4 w-4" />,
      expanded: false,
      items: [
        {
          label: 'CMS',
          href: '/integrations',
          icon: <Plug2 className="h-4 w-4" />,
        },
      ]
    },
  ];

  // Quick access items (non-expandable)
  const quickAccessItems: NavigationItem[] = [
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <nav className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 transform rotate-45 rounded"></div>
          <div>
            <h2 className="font-bold text-white">Catalyst Studio</h2>
            <p className="text-xs text-gray-400">Build faster</p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {navigationSections.map((section) => (
            <NavigationSection
              key={section.id}
              section={section}
              isActive={pathname.startsWith(`/${section.id}`)}
            />
          ))}
          
          {/* Quick Access Items */}
          <div className="pt-4 mt-4 border-t border-gray-700">
            {quickAccessItems.map((item) => {
              const isActive = pathname === item.href;
              if (item.featureFlag && !isFeatureEnabled(item.featureFlag)) {
                return null;
              }
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={`w-full justify-start ${
                      isActive 
                        ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          v1.0.0 • Story 1.5
        </p>
      </div>
    </nav>
  );
})