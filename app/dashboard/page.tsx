'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Users, Server, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [healthResponse, usersResponse] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/users'),
      ]);

      const healthData = await healthResponse.json();
      const usersData = await usersResponse.json();

      setHealthStatus(healthData);
      setUserCount(usersData.total);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your application status and metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Status</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? 'Loading...' : healthStatus?.status || 'Unknown'}
              </div>
              <p className="text-xs text-muted-foreground">
                {healthStatus?.environment || 'Environment'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? 'Loading...' : userCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Active users in the system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? 'Loading...' : healthStatus ? `${Math.floor(healthStatus.uptime)}s` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                System uptime
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Components</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">All Active</div>
              <p className="text-xs text-muted-foreground">
                Frontend & API running
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>Available API routes in your application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded hover:bg-muted">
                  <code className="text-sm">/api/health</code>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">GET</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-muted">
                  <code className="text-sm">/api/users</code>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">GET/POST</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-muted">
                  <code className="text-sm">/api/users/[id]</code>
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">GET/PUT/DELETE</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and navigation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/users" className="block">
                <Button className="w-full" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
              </Link>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => window.location.reload()}
              >
                <Activity className="mr-2 h-4 w-4" />
                Refresh Dashboard
              </Button>
              <Link href="/" className="block">
                <Button className="w-full" variant="outline">
                  Back to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}