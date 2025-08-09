'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ContentType, RelationshipType } from '@/lib/content-types/types';

interface RelationshipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentTypes: ContentType[];
  currentContentType: ContentType | null;
  onAddRelationship: (relationship: {
    targetContentTypeId: string;
    type: RelationshipType;
    fieldName: string;
  }) => void;
}

export function RelationshipModal({
  open,
  onOpenChange,
  contentTypes,
  currentContentType,
  onAddRelationship,
}: RelationshipModalProps) {
  const [targetContentTypeId, setTargetContentTypeId] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>(
    RelationshipType.ONE_TO_ONE
  );
  const [fieldName, setFieldName] = useState<string>('');

  const handleSubmit = () => {
    if (targetContentTypeId && fieldName) {
      onAddRelationship({
        targetContentTypeId,
        type: relationshipType,
        fieldName,
      });
      // Reset form
      setTargetContentTypeId('');
      setRelationshipType(RelationshipType.ONE_TO_ONE);
      setFieldName('');
      onOpenChange(false);
    }
  };

  const availableContentTypes = contentTypes.filter(
    ct => ct.id !== currentContentType?.id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Relationship</DialogTitle>
          <DialogDescription>
            Create a relationship between {currentContentType?.name} and another content type.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fieldName">Field Name</Label>
            <Input
              id="fieldName"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="e.g., author, category, relatedPosts"
            />
            <p className="text-xs text-muted-foreground">
              The field name that will hold this relationship
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetContentType">Target Content Type</Label>
            <Select value={targetContentTypeId} onValueChange={setTargetContentTypeId}>
              <SelectTrigger id="targetContentType">
                <SelectValue placeholder="Select a content type" />
              </SelectTrigger>
              <SelectContent>
                {availableContentTypes.map((ct) => (
                  <SelectItem key={ct.id} value={ct.id}>
                    <div className="flex items-center gap-2">
                      <span>{ct.icon}</span>
                      <span>{ct.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationshipType">Relationship Type</Label>
            <Select
              value={relationshipType}
              onValueChange={(value) => setRelationshipType(value as RelationshipType)}
            >
              <SelectTrigger id="relationshipType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RelationshipType.ONE_TO_ONE}>
                  <div className="flex flex-col">
                    <span>One to One (1:1)</span>
                    <span className="text-xs text-muted-foreground">
                      Each {currentContentType?.name} has one {targetContentTypeId && contentTypes.find(ct => ct.id === targetContentTypeId)?.name}
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value={RelationshipType.ONE_TO_MANY}>
                  <div className="flex flex-col">
                    <span>One to Many (1:N)</span>
                    <span className="text-xs text-muted-foreground">
                      Each {currentContentType?.name} has many {targetContentTypeId && contentTypes.find(ct => ct.id === targetContentTypeId)?.pluralName}
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value={RelationshipType.MANY_TO_ONE}>
                  <div className="flex flex-col">
                    <span>Many to One (N:1)</span>
                    <span className="text-xs text-muted-foreground">
                      Many {currentContentType?.pluralName} belong to one {targetContentTypeId && contentTypes.find(ct => ct.id === targetContentTypeId)?.name}
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value={RelationshipType.MANY_TO_MANY}>
                  <div className="flex flex-col">
                    <span>Many to Many (N:N)</span>
                    <span className="text-xs text-muted-foreground">
                      Many {currentContentType?.pluralName} have many {targetContentTypeId && contentTypes.find(ct => ct.id === targetContentTypeId)?.pluralName}
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!targetContentTypeId || !fieldName}
          >
            Add Relationship
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}