'use client';

import React, { useMemo } from 'react';
import { ContentType, Relationship, RelationshipType } from '@/lib/content-types/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, ArrowLeftRight, MoreHorizontal, Plus } from 'lucide-react';

interface RelationshipDiagramProps {
  contentTypes: ContentType[];
  currentContentType: ContentType | null;
  onAddRelationship?: () => void;
  onEditRelationship?: (relationship: Relationship) => void;
  onDeleteRelationship?: (relationshipId: string) => void;
}

export function RelationshipDiagram({
  contentTypes,
  currentContentType,
  onAddRelationship,
  onEditRelationship,
  onDeleteRelationship,
}: RelationshipDiagramProps) {
  // Calculate relationships for the current content type
  const relationships = useMemo(() => {
    if (!currentContentType) return { outgoing: [], incoming: [] };

    const outgoing = currentContentType.relationships || [];
    
    // Find incoming relationships from other content types
    const incoming = contentTypes
      .filter(ct => ct.id !== currentContentType.id)
      .flatMap(ct => 
        (ct.relationships || [])
          .filter(rel => rel.targetContentTypeId === currentContentType.id)
          .map(rel => ({ ...rel, sourceContentType: ct }))
      );

    return { outgoing, incoming };
  }, [contentTypes, currentContentType]);

  const getRelationshipIcon = (type: RelationshipType) => {
    switch (type) {
      case RelationshipType.ONE_TO_ONE:
        return <ArrowRight className="h-4 w-4" />;
      case RelationshipType.ONE_TO_MANY:
        return <ArrowRight className="h-4 w-4" />;
      case RelationshipType.MANY_TO_ONE:
        return <ArrowLeft className="h-4 w-4" />;
      case RelationshipType.MANY_TO_MANY:
        return <ArrowLeftRight className="h-4 w-4" />;
      default:
        return <ArrowRight className="h-4 w-4" />;
    }
  };

  const getRelationshipLabel = (type: RelationshipType) => {
    switch (type) {
      case RelationshipType.ONE_TO_ONE:
        return '1:1';
      case RelationshipType.ONE_TO_MANY:
        return '1:N';
      case RelationshipType.MANY_TO_ONE:
        return 'N:1';
      case RelationshipType.MANY_TO_MANY:
        return 'N:N';
      default:
        return '';
    }
  };

  const getTargetContentType = (targetId: string) => {
    return contentTypes.find(ct => ct.id === targetId);
  };

  if (!currentContentType) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          Select a content type to view its relationships
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Content Type */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentContentType.icon}</span>
            <div>
              <h3 className="text-lg font-semibold">{currentContentType.name}</h3>
              <p className="text-sm text-muted-foreground">
                {currentContentType.fields.length} fields
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddRelationship}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Relationship
          </Button>
        </div>

        {/* Outgoing Relationships */}
        {relationships.outgoing.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              References To
            </h4>
            <div className="space-y-2">
              {relationships.outgoing.map((rel) => {
                const targetType = getTargetContentType(rel.targetContentTypeId);
                if (!targetType) return null;

                return (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getRelationshipIcon(rel.type)}
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{targetType.icon}</span>
                        <span className="font-medium">{targetType.name}</span>
                      </div>
                      <span className="text-xs bg-background px-2 py-1 rounded">
                        {getRelationshipLabel(rel.type)}
                      </span>
                      {rel.fieldName && (
                        <span className="text-sm text-muted-foreground">
                          via "{rel.fieldName}"
                        </span>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEditRelationship?.(rel)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Incoming Relationships */}
        {relationships.incoming.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Referenced By
            </h4>
            <div className="space-y-2">
              {relationships.incoming.map((rel: any) => (
                <div
                  key={rel.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{rel.sourceContentType.icon}</span>
                      <span className="font-medium">{rel.sourceContentType.name}</span>
                    </div>
                    <span className="text-xs bg-background px-2 py-1 rounded">
                      {getRelationshipLabel(rel.type)}
                    </span>
                    {rel.fieldName && (
                      <span className="text-sm text-muted-foreground">
                        via "{rel.fieldName}"
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Relationships */}
        {relationships.outgoing.length === 0 && relationships.incoming.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No relationships defined yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddRelationship}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create First Relationship
            </Button>
          </div>
        )}
      </Card>

      {/* Visual Diagram */}
      {(relationships.outgoing.length > 0 || relationships.incoming.length > 0) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Relationship Map</h3>
          <div className="relative min-h-[200px] flex items-center justify-center">
            {/* Center - Current Content Type */}
            <div className="absolute z-10 flex flex-col items-center">
              <div className="bg-primary text-primary-foreground rounded-lg p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentContentType.icon}</span>
                  <span className="font-semibold">{currentContentType.name}</span>
                </div>
              </div>
            </div>

            {/* Left - Incoming Relationships */}
            {relationships.incoming.length > 0 && (
              <div className="absolute left-0 flex flex-col gap-2">
                {relationships.incoming.slice(0, 3).map((rel: any, index) => (
                  <div
                    key={rel.id}
                    className="flex items-center gap-2"
                    style={{ transform: `translateY(${(index - 1) * 40}px)` }}
                  >
                    <div className="bg-muted rounded-lg p-2 text-sm">
                      <div className="flex items-center gap-1">
                        <span>{rel.sourceContentType.icon}</span>
                        <span>{rel.sourceContentType.name}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}

            {/* Right - Outgoing Relationships */}
            {relationships.outgoing.length > 0 && (
              <div className="absolute right-0 flex flex-col gap-2">
                {relationships.outgoing.slice(0, 3).map((rel, index) => {
                  const targetType = getTargetContentType(rel.targetContentTypeId);
                  if (!targetType) return null;

                  return (
                    <div
                      key={rel.id}
                      className="flex items-center gap-2"
                      style={{ transform: `translateY(${(index - 1) * 40}px)` }}
                    >
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="bg-muted rounded-lg p-2 text-sm">
                        <div className="flex items-center gap-1">
                          <span>{targetType.icon}</span>
                          <span>{targetType.name}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}