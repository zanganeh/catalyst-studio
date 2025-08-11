'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useFeatureFlags } from '@/contexts/feature-flag-context-stub';
import { NavigationSection } from './navigation-section';
import { NavigationSection as NavigationSectionType } from '@/lib/navigation/types';
import { FeatureName } from '@/config/features-stub';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Home,
  Database,
  Eye,
  BarChart3,
  Code2,
  Plug2,
  FolderOpen,
  Settings,
  Rocket,
} from 'lucide-react';

interface DirectLinkItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  featureFlag?: FeatureName;
  tooltip?: string;
}

export const NavigationSidebar = React.memo(function NavigationSidebar() {
  const pathname = usePathname();
  const { isEnabled: isFeatureEnabled } = useFeatureFlags();

  // Direct link items (not expandable)
  const directLinks: DirectLinkItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      href: '/studio/overview',
      icon: <Home className="h-4 w-4" />,
    },
  ];

  // Expandable navigation sections
  const navigationSections: NavigationSectionType[] = [
    {
      id: 'content',
      label: 'Content',
      icon: <Database className="h-4 w-4" />,
      expanded: false,
      items: [
        {
          label: 'Content Items',
          href: '/studio/content',
          icon: <FolderOpen className="h-4 w-4" />,
          tooltip: 'Browse and manage your content entries',
        },
        {
          label: 'Content Modeling',
          href: '/studio/content-builder',
          icon: <Database className="h-4 w-4" />,
          featureFlag: 'contentTypeBuilder',
          tooltip: 'Design content schemas and data structures',
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
          href: '/studio/development',
          icon: <Code2 className="h-4 w-4" />,
        },
        {
          label: 'CMS Deployment',
          href: '/studio/deployment',
          icon: <Rocket className="h-4 w-4" />,
          tooltip: 'Deploy your website to CMS platforms',
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
          label: 'CMS Connections',
          href: '/studio/integrations',
          icon: <Plug2 className="h-4 w-4" />,
        },
      ]
    },
  ];

  // More direct links after sections
  const additionalDirectLinks: DirectLinkItem[] = [
    {
      id: 'preview',
      label: 'Preview',
      href: '/studio/preview',
      icon: <Eye className="h-4 w-4" />,
      featureFlag: 'previewSystem',
      tooltip: 'Preview your website across different devices and screen sizes',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/studio/analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      tooltip: 'Track and analyze your project performance',
    },
  ];

  // Bottom quick access items
  const bottomItems: DirectLinkItem[] = [
    {
      id: 'settings',
      label: 'Settings',
      href: '/studio/settings',
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  const renderDirectLink = (item: DirectLinkItem) => {
    const isActive = pathname === item.href;
    
    if (item.featureFlag && !isFeatureEnabled(item.featureFlag)) {
      return null;
    }

    const linkContent = (
      <Link key={item.id} href={item.href}>
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

    if (item.tooltip) {
      return (
        <TooltipProvider key={item.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              {linkContent}
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return linkContent;
  };

  return (
    <nav className="w-[260px] bg-gray-800/50 backdrop-blur-sm border-r border-gray-700 flex flex-col h-full">
      {/* Header Section */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div>
            <h2 className="font-semibold text-white">Catalyst Studio</h2>
            <p className="text-xs text-gray-400">AI Website Builder</p>
          </div>
        </div>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {/* Direct Links at Top */}
          {directLinks.map(renderDirectLink)}

          {/* Expandable Sections */}
          {navigationSections.map((section) => (
            <NavigationSection
              key={section.id}
              section={section}
              isActive={pathname.startsWith(`/${section.id}`)}
            />
          ))}

          {/* Additional Direct Links */}
          {additionalDirectLinks.map(renderDirectLink)}
          
          {/* Bottom Quick Access Items */}
          <div className="pt-4 mt-4 border-t border-gray-700">
            {bottomItems.map(renderDirectLink)}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          v1.0.0 • Story 1.5a
        </p>
      </div>
    </nav>
  );
});