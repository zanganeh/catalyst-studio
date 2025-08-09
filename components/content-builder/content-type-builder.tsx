'use client';

import React, { useState } from 'react';
import { useContentTypes } from '@/lib/context/content-type-context';
import { ContentType, Field, FieldType } from '@/lib/content-types/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Edit2, Trash2, GripVertical, Settings } from 'lucide-react';

interface ContentTypeBuilderProps {
  contentTypeId?: string;
}

export default function ContentTypeBuilder({ contentTypeId }: ContentTypeBuilderProps) {
  const {
    contentTypes,
    currentContentType,
    setCurrentContentType,
    createContentType,
    updateContentType,
    deleteField,
    updateField,
  } = useContentTypes();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentContentType?.name || '');
  const [selectedField, setSelectedField] = useState<Field | null>(null);

  // Initialize with content type if ID provided
  React.useEffect(() => {
    if (contentTypeId) {
      const contentType = contentTypes.find(ct => ct.id === contentTypeId);
      if (contentType) {
        setCurrentContentType(contentType);
        setNameInput(contentType.name);
      }
    } else if (!currentContentType) {
      // Create a new content type if none exists
      const newContentType = createContentType('NewContentType');
      setNameInput(newContentType.name);
    }
  }, [contentTypeId, contentTypes, currentContentType, setCurrentContentType, createContentType]);

  const handleNameSave = () => {
    if (currentContentType && nameInput.trim()) {
      updateContentType(currentContentType.id, {
        name: nameInput.trim(),
        pluralName: `${nameInput.trim()}s`,
      });
      setIsEditingName(false);
    }
  };

  const handleFieldClick = (field: Field) => {
    setSelectedField(field);
  };

  const handleDeleteField = (fieldId: string) => {
    if (currentContentType) {
      deleteField(currentContentType.id, fieldId);
      if (selectedField?.id === fieldId) {
        setSelectedField(null);
      }
    }
  };

  const getFieldIcon = (type: FieldType): string => {
    switch (type) {
      case FieldType.TEXT:
        return '📝';
      case FieldType.NUMBER:
        return '🔢';
      case FieldType.BOOLEAN:
        return '✓';
      case FieldType.DATE:
        return '📅';
      case FieldType.IMAGE:
        return '🖼️';
      case FieldType.RICH_TEXT:
        return '📄';
      case FieldType.REFERENCE:
        return '🔗';
      default:
        return '📋';
    }
  };

  if (!currentContentType) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">No Content Type Selected</h2>
          <Button onClick={() => {
            const newContentType = createContentType('NewContentType');
            setNameInput(newContentType.name);
          }}>
            Create New Content Type
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Content Type Name */}
      <div className="border-b p-6 bg-background">
        <div className="flex items-center gap-4">
          <span className="text-3xl">{currentContentType.icon}</span>
          {isEditingName ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') {
                    setNameInput(currentContentType.name);
                    setIsEditingName(false);
                  }
                }}
                className="text-2xl font-bold"
                autoFocus
              />
              <Button size="sm" onClick={handleNameSave}>Save</Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNameInput(currentContentType.name);
                  setIsEditingName(false);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <h1 className="text-2xl font-bold">{currentContentType.name}</h1>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsEditingName(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <p className="text-muted-foreground mt-2">
          {currentContentType.fields.length} field{currentContentType.fields.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Fields List */}
      <div className="flex-1 overflow-auto p-6">
        {currentContentType.fields.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-6">
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
                <Plus className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No fields yet</h3>
              <p className="text-muted-foreground">
                Start building your content type by adding fields
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => {
                // TODO: Open field type modal
                console.log('Open field type modal');
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Field
            </Button>
          </div>
        ) : (
          // Fields List
          <div className="space-y-3">
            {currentContentType.fields
              .sort((a, b) => a.order - b.order)
              .map((field) => (
                <Card
                  key={field.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
                    selectedField?.id === field.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleFieldClick(field)}
                >
                  <div className="flex items-center gap-3">
                    {/* Drag Handle */}
                    <div className="cursor-move">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {/* Field Icon */}
                    <div className="text-2xl">{getFieldIcon(field.type)}</div>

                    {/* Field Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{field.label}</h3>
                        {field.required && (
                          <span className="text-xs text-red-500">Required</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {field.name} · {field.type}
                      </p>
                      {field.helpText && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {field.helpText}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Open field properties panel
                          console.log('Edit field properties');
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteField(field.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

            {/* Add Field Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // TODO: Open field type modal
                console.log('Open field type modal');
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}