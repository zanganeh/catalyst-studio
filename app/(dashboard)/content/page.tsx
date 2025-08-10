'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  PlusCircle, 
  FileText, 
  FolderOpen, 
  Search, 
  Filter,
  Calendar,
  User,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Database
} from 'lucide-react'

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Items</h1>
        <p className="text-muted-foreground mt-2">
          Browse and manage all your content instances. These are the actual content entries created from your content models.
        </p>
      </div>

      <div className="flex gap-4">
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Entry
        </Button>
        
        <Button variant="outline">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Blog Posts
                  <span className="text-xs bg-secondary px-2 py-1 rounded">Content Type</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  12 published entries • Based on Blog Post model
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" title="View Blog Post content model">
                <Database className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors">
                <div className="flex-1">
                  <div className="font-medium">Getting Started with Catalyst</div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      John Doe
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      2 hours ago
                    </span>
                    <span className="text-xs border px-2 py-0.5 rounded">Published</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" title="View">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Edit">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors">
                <div className="flex-1">
                  <div className="font-medium">Advanced Content Modeling</div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Jane Smith
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      1 day ago
                    </span>
                    <span className="text-xs border px-2 py-0.5 rounded">Draft</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" title="View">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Edit">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-green-500" />
                  Pages
                  <span className="text-xs bg-secondary px-2 py-1 rounded">Content Type</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  8 published entries • Based on Page model
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" title="View Page content model">
                <Database className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors">
                <div className="flex-1">
                  <div className="font-medium">Home</div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Admin
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      1 week ago
                    </span>
                    <span className="text-xs border px-2 py-0.5 rounded">Published</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" title="View">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Edit">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}