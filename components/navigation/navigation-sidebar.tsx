'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { isFeatureEnabled, FeatureName } from '@/config/features';
import {
  MessageSquare,
  Layout,
  Settings,
  Home,
  Database,
  Package,
  Eye,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  featureFlag?: FeatureName;
}

export function NavigationSidebar() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: 'Home',
      href: '/',
      icon: <Home className="h-4 w-4" />,
    },
    {
      label: 'Chat',
      href: '/chat',
      icon: <MessageSquare className="h-4 w-4" />,
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
    {
      label: 'Components',
      href: '/components',
      icon: <Package className="h-4 w-4" />,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  // Filter nav items based on feature flags
  // Use stable feature flags to avoid hydration mismatch
  const [visibleNavItems, setVisibleNavItems] = React.useState(navItems);
  
  React.useEffect(() => {
    // Only filter on client side after hydration
    const filtered = navItems.filter(item => {
      if (item.featureFlag) {
        return isFeatureEnabled(item.featureFlag);
      }
      return true;
    });
    setVisibleNavItems(filtered);
  }, []);

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

      {/* Navigation Items */}
      <div className="flex-1 p-4">
        <div className="space-y-2">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full justify-start ${
                    isActive 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
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

      {/* Footer Section */}
      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          v1.0.0 • Story 1.3
        </p>
      </div>
    </nav>
  );
}