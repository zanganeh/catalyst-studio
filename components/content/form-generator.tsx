'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { Label } from '@/components/ui/label';
import type { ContentType, ContentItem, Field, FieldType } from '@/lib/content-types/types';

interface FormGeneratorProps {
  contentType: ContentType;
  contentItem?: ContentItem | null;
  onSubmit: (data: Record<string, unknown>) => void;
}

// Create dynamic Zod schema based on field configuration
function createDynamicSchema(fields: Field[]) {
  const schemaShape: Record<string, z.ZodType<unknown>> = {};
  
  fields.forEach((field) => {
    let fieldSchema: z.ZodType<unknown>;
    
    switch (field.type) {
      case 'text':
        fieldSchema = z.string();
        if (field.validation) {
          const validation = field.validation as Record<string, unknown>;
          if (typeof validation.minLength === 'number') {
            fieldSchema = (fieldSchema as z.ZodString).min(validation.minLength);
          }
          if (typeof validation.maxLength === 'number') {
            fieldSchema = (fieldSchema as z.ZodString).max(validation.maxLength);
          }
          if (typeof validation.pattern === 'string') {
            fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(validation.pattern));
          }
        }
        break;
      
      case 'richText':
        fieldSchema = z.string();
        break;
      
      case 'number':
        fieldSchema = z.number();
        if (field.validation) {
          const validation = field.validation as Record<string, unknown>;
          if (typeof validation.min === 'number') {
            fieldSchema = (fieldSchema as z.ZodNumber).min(validation.min);
          }
          if (typeof validation.max === 'number') {
            fieldSchema = (fieldSchema as z.ZodNumber).max(validation.max);
          }
        }
        break;
      
      case 'boolean':
        fieldSchema = z.boolean();
        break;
      
      case 'date':
        fieldSchema = z.string(); // Date as ISO string
        break;
      
      case 'image':
        fieldSchema = z.string(); // URL or base64
        break;
      
      case 'reference':
        fieldSchema = z.string(); // Reference ID
        break;
      
      default:
        fieldSchema = z.unknown();
    }
    
    if (!field.required) {
      fieldSchema = fieldSchema.optional();
    }
    
    schemaShape[field.name] = fieldSchema;
  });
  
  return z.object(schemaShape);
}

// Individual field renderer components
interface FieldProps {
  field: Field;
  control: any; // Control type from react-hook-form
  errors: Record<string, { message?: string }>;
}

function TextField({ field, control, errors }: FieldProps) {
  const errorId = `${field.name}-error`;
  const helpId = `${field.name}-help`;
  
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name} className="text-gray-300">
        {field.label}
        {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </Label>
      <Controller
        name={field.name}
        control={control}
        defaultValue={field.defaultValue || ''}
        render={({ field: formField }) => (
          <Input
            {...formField}
            id={field.name}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
            aria-required={field.required}
            aria-invalid={!!errors[field.name]}
            aria-describedby={`${field.helpText ? helpId : ''} ${errors[field.name] ? errorId : ''}`.trim()}
          />
        )}
      />
      {field.helpText && (
        <p id={helpId} className="text-sm text-gray-500">{field.helpText}</p>
      )}
      {errors[field.name] && (
        <p id={errorId} role="alert" className="text-sm text-red-500">{errors[field.name]?.message}</p>
      )}
    </div>
  );
}

function RichTextField({ field, control, errors }: FieldProps) {
  const errorId = `${field.name}-error`;
  const helpId = `${field.name}-help`;
  
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name} className="text-gray-300">
        {field.label}
        {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </Label>
      <Controller
        name={field.name}
        control={control}
        defaultValue={field.defaultValue || ''}
        render={({ field: formField }) => (
          <Textarea
            {...formField}
            id={field.name}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 min-h-[120px]"
            aria-required={field.required}
            aria-invalid={!!errors[field.name]}
            aria-describedby={`${field.helpText ? helpId : ''} ${errors[field.name] ? errorId : ''}`.trim()}
          />
        )}
      />
      {field.helpText && (
        <p id={helpId} className="text-sm text-gray-500">{field.helpText}</p>
      )}
      {errors[field.name] && (
        <p id={errorId} role="alert" className="text-sm text-red-500">{errors[field.name]?.message}</p>
      )}
    </div>
  );
}

function NumberField({ field, control, errors }: FieldProps) {
  const errorId = `${field.name}-error`;
  const helpId = `${field.name}-help`;
  
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name} className="text-gray-300">
        {field.label}
        {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </Label>
      <Controller
        name={field.name}
        control={control}
        defaultValue={field.defaultValue || 0}
        render={({ field: formField }) => (
          <Input
            {...formField}
            type="number"
            id={field.name}
            placeholder={field.placeholder || '0'}
            className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
            onChange={(e) => formField.onChange(parseFloat(e.target.value))}
            aria-required={field.required}
            aria-invalid={!!errors[field.name]}
            aria-describedby={`${field.helpText ? helpId : ''} ${errors[field.name] ? errorId : ''}`.trim()}
          />
        )}
      />
      {field.helpText && (
        <p id={helpId} className="text-sm text-gray-500">{field.helpText}</p>
      )}
      {errors[field.name] && (
        <p id={errorId} role="alert" className="text-sm text-red-500">{errors[field.name]?.message}</p>
      )}
    </div>
  );
}

function BooleanField({ field, control }: Omit<FieldProps, 'errors'>) {
  const helpId = `${field.name}-help`;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Controller
          name={field.name}
          control={control}
          defaultValue={field.defaultValue || false}
          render={({ field: formField }) => (
            <Switch
              id={field.name}
              checked={formField.value}
              onCheckedChange={formField.onChange}
              className="data-[state=checked]:bg-orange-500"
              aria-required={field.required}
              aria-describedby={field.helpText ? helpId : undefined}
            />
          )}
        />
        <Label htmlFor={field.name} className="text-gray-300 cursor-pointer">
          {field.label}
          {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </Label>
      </div>
      {field.helpText && (
        <p id={helpId} className="text-sm text-gray-500">{field.helpText}</p>
      )}
    </div>
  );
}

function DateField({ field, control, errors }: FieldProps) {
  const errorId = `${field.name}-error`;
  const helpId = `${field.name}-help`;
  
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name} className="text-gray-300">
        {field.label}
        {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </Label>
      <Controller
        name={field.name}
        control={control}
        defaultValue={field.defaultValue || ''}
        render={({ field: formField }) => (
          <div className="relative">
            <Input
              {...formField}
              type="date"
              id={field.name}
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              aria-required={field.required}
              aria-invalid={!!errors[field.name]}
              aria-describedby={`${field.helpText ? helpId : ''} ${errors[field.name] ? errorId : ''}`.trim()}
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" aria-hidden="true" />
          </div>
        )}
      />
      {field.helpText && (
        <p id={helpId} className="text-sm text-gray-500">{field.helpText}</p>
      )}
      {errors[field.name] && (
        <p id={errorId} role="alert" className="text-sm text-red-500">{errors[field.name]?.message}</p>
      )}
    </div>
  );
}

function ImageField({ field, control, errors }: FieldProps) {
  const errorId = `${field.name}-error`;
  const helpId = `${field.name}-help`;
  const [urlError, setUrlError] = React.useState<string>('');
  
  const validateImageUrl = (url: string) => {
    if (!url) {
      setUrlError('');
      return;
    }
    
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setUrlError('Only HTTP(S) URLs are allowed');
        return;
      }
      setUrlError('');
    } catch {
      setUrlError('Please enter a valid URL');
    }
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name} className="text-gray-300">
        {field.label}
        {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </Label>
      <Controller
        name={field.name}
        control={control}
        defaultValue={field.defaultValue || ''}
        render={({ field: formField }) => (
          <div className="space-y-2">
            <Input
              {...formField}
              type="url"
              id={field.name}
              placeholder="Enter image URL (https://...)"
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              onChange={(e) => {
                formField.onChange(e);
                validateImageUrl(e.target.value);
              }}
              aria-required={field.required}
              aria-invalid={!!errors[field.name] || !!urlError}
              aria-describedby={`${field.helpText ? helpId : ''} ${errors[field.name] || urlError ? errorId : ''}`.trim()}
            />
            {formField.value && !urlError && (
              <div className="relative w-full h-32 bg-gray-800 rounded-md overflow-hidden" role="img" aria-label="Image preview">
                <img
                  src={formField.value}
                  alt="Preview of uploaded image"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    setUrlError('Failed to load image');
                  }}
                />
              </div>
            )}
          </div>
        )}
      />
      {field.helpText && (
        <p id={helpId} className="text-sm text-gray-500">{field.helpText}</p>
      )}
      {(errors[field.name] || urlError) && (
        <p id={errorId} role="alert" className="text-sm text-red-500">
          {errors[field.name]?.message || urlError}
        </p>
      )}
    </div>
  );
}

function ReferenceField({ field, control, errors }: FieldProps) {
  const errorId = `${field.name}-error`;
  const helpId = `${field.name}-help`;
  
  // TODO: This would need to fetch and display available references
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name} className="text-gray-300">
        {field.label}
        {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </Label>
      <Controller
        name={field.name}
        control={control}
        defaultValue={field.defaultValue || ''}
        render={({ field: formField }) => (
          <Select 
            value={formField.value} 
            onValueChange={formField.onChange}
            aria-required={field.required}
            aria-invalid={!!errors[field.name]}
            aria-describedby={`${field.helpText ? helpId : ''} ${errors[field.name] ? errorId : ''}`.trim()}
          >
            <SelectTrigger id={field.name} className="bg-gray-800/50 border-gray-700 text-white">
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="ref1" className="text-gray-300 hover:bg-gray-800">
                Reference Item 1
              </SelectItem>
              <SelectItem value="ref2" className="text-gray-300 hover:bg-gray-800">
                Reference Item 2
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      />
      {field.helpText && (
        <p id={helpId} className="text-sm text-gray-500">{field.helpText}</p>
      )}
      {errors[field.name] && (
        <p id={errorId} role="alert" className="text-sm text-red-500">{errors[field.name]?.message}</p>
      )}
    </div>
  );
}

// Field renderer based on type
function renderField(field: Field, control: any, errors: Record<string, { message?: string }>) {
  const props = { field, control, errors };
  
  switch (field.type) {
    case 'text':
      return <TextField key={field.id} {...props} />;
    case 'richText':
      return <RichTextField key={field.id} {...props} />;
    case 'number':
      return <NumberField key={field.id} {...props} />;
    case 'boolean':
      return <BooleanField key={field.id} {...props} />;
    case 'date':
      return <DateField key={field.id} {...props} />;
    case 'image':
      return <ImageField key={field.id} {...props} />;
    case 'reference':
      return <ReferenceField key={field.id} {...props} />;
    default:
      return <TextField key={field.id} {...props} />;
  }
}

export function FormGenerator({ contentType, contentItem, onSubmit }: FormGeneratorProps) {
  const schema = createDynamicSchema(contentType.fields);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: contentItem?.data || {},
  });
  
  // Reset form when content item changes
  useEffect(() => {
    reset(contentItem?.data || {});
  }, [contentItem, reset]);
  
  // Handle keyboard shortcuts with proper cleanup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const form = document.getElementById('content-form') as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }
    };
    
    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup function to prevent memory leaks
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty deps array is safe here as we don't use any external values
  
  // Sort fields by order
  const sortedFields = [...contentType.fields].sort((a, b) => a.order - b.order);
  
  return (
    <form id="content-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {sortedFields.map((field) => renderField(field, control, errors))}
    </form>
  );
}