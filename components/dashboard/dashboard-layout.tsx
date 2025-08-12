import React from 'react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-2xl font-bold">Catalyst Studio</h1>
            <div className="flex items-center gap-4">
              {/* User menu, settings, etc. - To be added in future stories */}
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}