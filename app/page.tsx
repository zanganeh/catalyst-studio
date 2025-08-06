'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, Server, Database } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Catalyst App
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A modern Next.js application with shadcn/ui components, API routes, and full-stack capabilities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Server className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>API Backend</CardTitle>
              <CardDescription>RESTful API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Built-in API routes for handling server-side logic
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>User Management</CardTitle>
              <CardDescription>CRUD operations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Complete user management system with API integration
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Database className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Database Ready</CardTitle>
              <CardDescription>Prisma ORM support</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Easy database integration with Prisma ORM
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Activity className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Health Check</CardTitle>
              <CardDescription>API monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Built-in health check endpoint for monitoring
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="min-w-[200px]">
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/users">
            <Button size="lg" variant="outline" className="min-w-[200px]">
              View Users
            </Button>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <code className="block p-4 bg-muted rounded-lg text-sm">
                npm run dev
              </code>
              <p className="mt-4 text-muted-foreground">
                Single command to run both frontend and API backend
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}