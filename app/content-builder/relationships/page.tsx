'use client';

import { useState } from 'react';
import { useContentTypes } from '@/lib/context/content-type-context';
import { Relationship, RelationshipType } from '@/lib/content-types/types';
import { RelationshipDiagram } from '@/components/content-builder/relationship-diagram';
import { RelationshipModal } from '@/components/content-builder/relationship-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RelationshipsPage() {
  const {
    contentTypes,
    currentContentType,
    addRelationship,
    deleteRelationship,
  } = useContentTypes();

  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);

  const handleAddRelationship = (relationship: {
    targetContentTypeId: string;
    type: RelationshipType;
    fieldName: string;
  }) => {
    if (currentContentType) {
      addRelationship(currentContentType.id, relationship);
    }
  };

  const handleEditRelationship = (relationship: Relationship) => {
    // For now, just log - could open an edit modal
    console.log('Edit relationship:', relationship);
  };

  const handleDeleteRelationship = (relationshipId: string) => {
    if (currentContentType) {
      deleteRelationship(currentContentType.id, relationshipId);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/content-builder">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Content Relationships</h1>
            <p className="text-muted-foreground">
              Visualize and manage relationships between content types
            </p>
          </div>
        </div>
      </div>

      {/* Content Type Selector */}
      {contentTypes.length > 1 && (
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-3 overflow-x-auto">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Select Content Type:
            </span>
            {contentTypes.map((ct) => (
              <Button
                key={ct.id}
                variant={currentContentType?.id === ct.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  // This would need to be added to context
                  console.log('Select content type:', ct.id);
                }}
                className="gap-2"
              >
                <span>{ct.icon}</span>
                <span>{ct.name}</span>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Relationship Diagram */}
      <RelationshipDiagram
        contentTypes={contentTypes}
        currentContentType={currentContentType}
        onAddRelationship={() => setIsRelationshipModalOpen(true)}
        onEditRelationship={handleEditRelationship}
        onDeleteRelationship={handleDeleteRelationship}
      />

      {/* Relationship Modal */}
      <RelationshipModal
        open={isRelationshipModalOpen}
        onOpenChange={setIsRelationshipModalOpen}
        contentTypes={contentTypes}
        currentContentType={currentContentType}
        onAddRelationship={handleAddRelationship}
      />
    </div>
  );
}