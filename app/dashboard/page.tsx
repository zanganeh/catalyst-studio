import { Metadata } from 'next';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { WebsiteGrid } from '@/components/dashboard/website-grid';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

export const metadata: Metadata = {
  title: 'Dashboard - Catalyst Studio',
  description: 'Manage all your websites from one place',
};

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8" aria-label="Dashboard content">
        {/* AI Prompt Section - Placeholder for Story 3.4 */}
        <div className="mb-8" aria-hidden="true">
          {/* Will be implemented in Story 3.4 */}
        </div>
        
        {/* Website Grid */}
        <section aria-label="Your websites">
          <WebsiteGrid />
        </section>
      </main>
    </DashboardLayout>
  );
}