'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { FIELD_CATEGORIES, FieldType } from '@/lib/content-types/types';
import { useContentTypes } from '@/lib/context/content-type-context';
import { X } from 'lucide-react';

interface FieldTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentTypeId: string;
}

export function FieldTypeModal({ open, onOpenChange, contentTypeId }: FieldTypeModalProps) {
  const { addField } = useContentTypes();

  const handleFieldTypeSelect = (fieldType: FieldType) => {
    addField(contentTypeId, fieldType);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal Content */}
      <div className="relative bg-background border rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <h2 className="text-lg font-semibold">Add a Field</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a field type to add to your content type
          </p>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {FIELD_CATEGORIES.map((category) => (
              <div key={category.name}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  {category.label}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {category.fields.map((field) => (
                    <Card
                      key={field.type}
                      className="p-4 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleFieldTypeSelect(field.type)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{field.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{field.label}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {field.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}