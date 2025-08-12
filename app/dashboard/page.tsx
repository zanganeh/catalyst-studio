import { Metadata } from 'next';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { WebsiteGrid } from '@/components/dashboard/website-grid';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { WebsiteCreator } from '@/components/dashboard/website-creator';

export const metadata: Metadata = {
  title: 'Dashboard - Catalyst Studio',
  description: 'Manage all your websites from one place',
};

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8" aria-label="Dashboard content">
        {/* AI Prompt Section */}
        <div className="mb-8">
          <WebsiteCreator />
        </div>
        
        {/* Website Grid */}
        <section aria-label="Your websites">
          <WebsiteGrid />
        </section>
      </main>
    </DashboardLayout>
  );
}