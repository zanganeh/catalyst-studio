'use client';

import React, { useState, useEffect } from 'react';
import { Field, FieldType } from '@/lib/content-types/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { getFieldIcon } from '@/lib/content-types/field-utils';

interface FieldPropertiesPanelProps {
  field: Field | null;
  onUpdateField: (updates: Partial<Field>) => void;
  onClose: () => void;
}

export function FieldPropertiesPanel({
  field,
  onUpdateField,
  onClose,
}: FieldPropertiesPanelProps) {
  const [localField, setLocalField] = useState<Field | null>(null);

  useEffect(() => {
    setLocalField(field);
  }, [field]);

  if (!localField) {
    return null;
  }

  const handleChange = (key: keyof Field, value: unknown) => {
    setLocalField(prev => {
      if (!prev) return null;
      return { ...prev, [key]: value };
    });
  };

  const handleSave = () => {
    if (localField) {
      const updates: Partial<Field> = {
        name: localField.name,
        label: localField.label,
        required: localField.required,
        placeholder: localField.placeholder,
        helpText: localField.helpText,
        defaultValue: localField.defaultValue,
      };

      // Add validation rules if applicable
      if (localField.validation) {
        updates.validation = localField.validation;
      }

      onUpdateField(updates);
      onClose();
    }
  };

  const renderFieldSpecificSettings = () => {
    switch (localField.type) {
      case FieldType.TEXT:
      case FieldType.RICH_TEXT:
        return (
          <>
            <div>
              <Label htmlFor="minLength">Min Length</Label>
              <Input
                id="minLength"
                type="number"
                min="0"
                value={(localField.validation as any)?.minLength || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : undefined;
                  handleChange('validation', {
                    ...localField.validation,
                    minLength: value,
                  });
                }}
              />
            </div>
            <div>
              <Label htmlFor="maxLength">Max Length</Label>
              <Input
                id="maxLength"
                type="number"
                min="0"
                value={(localField.validation as any)?.maxLength || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : undefined;
                  handleChange('validation', {
                    ...localField.validation,
                    maxLength: value,
                  });
                }}
              />
            </div>
            <div>
              <Label htmlFor="pattern">Pattern (RegEx)</Label>
              <Input
                id="pattern"
                value={(localField.validation as any)?.pattern || ''}
                onChange={(e) => {
                  handleChange('validation', {
                    ...localField.validation,
                    pattern: e.target.value || undefined,
                  });
                }}
                placeholder="e.g., ^[A-Z].*"
              />
            </div>
          </>
        );

      case FieldType.NUMBER:
        return (
          <>
            <div>
              <Label htmlFor="min">Min Value</Label>
              <Input
                id="min"
                type="number"
                value={(localField.validation as any)?.min !== undefined ? (localField.validation as any).min : ''}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                  handleChange('validation', {
                    ...localField.validation,
                    min: value,
                  });
                }}
              />
            </div>
            <div>
              <Label htmlFor="max">Max Value</Label>
              <Input
                id="max"
                type="number"
                value={(localField.validation as any)?.max !== undefined ? (localField.validation as any).max : ''}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                  handleChange('validation', {
                    ...localField.validation,
                    max: value,
                  });
                }}
              />
            </div>
            <div>
              <Label htmlFor="step">Step</Label>
              <Input
                id="step"
                type="number"
                min="0"
                step="0.01"
                value={(localField.validation as any)?.step || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                  handleChange('validation', {
                    ...localField.validation,
                    step: value,
                  });
                }}
                placeholder="e.g., 0.01"
              />
            </div>
          </>
        );

      case FieldType.DATE:
        return (
          <>
            <div>
              <Label htmlFor="minDate">Min Date</Label>
              <Input
                id="minDate"
                type="date"
                value={(localField.validation as any)?.minDate || ''}
                onChange={(e) => {
                  handleChange('validation', {
                    ...localField.validation,
                    minDate: e.target.value || undefined,
                  });
                }}
              />
            </div>
            <div>
              <Label htmlFor="maxDate">Max Date</Label>
              <Input
                id="maxDate"
                type="date"
                value={(localField.validation as any)?.maxDate || ''}
                onChange={(e) => {
                  handleChange('validation', {
                    ...localField.validation,
                    maxDate: e.target.value || undefined,
                  });
                }}
              />
            </div>
          </>
        );

      case FieldType.IMAGE:
        return (
          <>
            <div>
              <Label htmlFor="maxSize">Max File Size (MB)</Label>
              <Input
                id="maxSize"
                type="number"
                min="0"
                step="0.1"
                value={(localField.validation as any)?.maxSize || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                  handleChange('validation', {
                    ...localField.validation,
                    maxSize: value,
                  });
                }}
              />
            </div>
            <div>
              <Label htmlFor="allowedTypes">Allowed File Types</Label>
              <Input
                id="allowedTypes"
                value={(localField.validation as any)?.allowedTypes?.join(', ') || ''}
                onChange={(e) => {
                  const types = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                  handleChange('validation', {
                    ...localField.validation,
                    allowedTypes: types.length > 0 ? types : undefined,
                  });
                }}
                placeholder="e.g., jpg, png, gif"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const getDefaultValueInput = () => {
    switch (localField.type) {
      case FieldType.TEXT:
      case FieldType.RICH_TEXT:
        return (
          <Input
            id="defaultValue"
            value={localField.defaultValue || ''}
            onChange={(e) => handleChange('defaultValue', e.target.value || undefined)}
            placeholder="Enter default text"
          />
        );

      case FieldType.NUMBER:
        return (
          <Input
            id="defaultValue"
            type="number"
            value={localField.defaultValue !== undefined ? localField.defaultValue : ''}
            onChange={(e) => {
              const value = e.target.value ? parseFloat(e.target.value) : undefined;
              handleChange('defaultValue', value);
            }}
            placeholder="Enter default number"
          />
        );

      case FieldType.BOOLEAN:
        return (
          <Switch
            id="defaultValue"
            checked={localField.defaultValue || false}
            onCheckedChange={(checked) => handleChange('defaultValue', checked)}
          />
        );

      case FieldType.DATE:
        return (
          <Input
            id="defaultValue"
            type="date"
            value={localField.defaultValue || ''}
            onChange={(e) => handleChange('defaultValue', e.target.value || undefined)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Card className="fixed right-0 top-0 h-full w-96 overflow-auto z-50 shadow-xl rounded-none">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getFieldIcon(localField.type)}</span>
            <div>
              <h2 className="text-xl font-semibold">Field Properties</h2>
              <p className="text-sm text-muted-foreground">{localField.type}</p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Basic Properties */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Field Name (API)</Label>
            <Input
              id="name"
              value={localField.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., firstName"
              pattern="^[a-zA-Z][a-zA-Z0-9_]*$"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used in API responses (camelCase recommended)
            </p>
          </div>

          <div>
            <Label htmlFor="label">Display Label</Label>
            <Input
              id="label"
              value={localField.label}
              onChange={(e) => handleChange('label', e.target.value)}
              placeholder="e.g., First Name"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="required">Required Field</Label>
            <Switch
              id="required"
              checked={localField.required}
              onCheckedChange={(checked) => handleChange('required', checked)}
            />
          </div>

          <div>
            <Label htmlFor="placeholder">Placeholder Text</Label>
            <Input
              id="placeholder"
              value={localField.placeholder || ''}
              onChange={(e) => handleChange('placeholder', e.target.value || undefined)}
              placeholder="e.g., Enter your first name"
            />
          </div>

          <div>
            <Label htmlFor="helpText">Help Text</Label>
            <Textarea
              id="helpText"
              value={localField.helpText || ''}
              onChange={(e) => handleChange('helpText', e.target.value || undefined)}
              placeholder="Provide helpful instructions for this field"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="defaultValue">Default Value</Label>
            {getDefaultValueInput()}
          </div>
        </div>

        {/* Field-Specific Validation */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm uppercase text-muted-foreground">
            Validation Rules
          </h3>
          {renderFieldSpecificSettings()}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Card>
  );
}