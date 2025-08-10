'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, FileText, FolderOpen, Search } from 'lucide-react'

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Items</h1>
        <p className="text-muted-foreground mt-2">
          Manage and organize your content across all content types.
        </p>
      </div>

      <div className="flex gap-4">
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Content
        </Button>
        <Button variant="outline">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Blog Posts
            </CardTitle>
            <CardDescription>12 items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                <span>Getting Started with Catalyst</span>
                <span className="text-sm text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                <span>Advanced Content Modeling</span>
                <span className="text-sm text-muted-foreground">1 day ago</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                <span>Performance Optimization Tips</span>
                <span className="text-sm text-muted-foreground">3 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Pages
            </CardTitle>
            <CardDescription>8 items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                <span>Home</span>
                <span className="text-sm text-muted-foreground">1 week ago</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                <span>About Us</span>
                <span className="text-sm text-muted-foreground">2 weeks ago</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                <span>Contact</span>
                <span className="text-sm text-muted-foreground">3 weeks ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}