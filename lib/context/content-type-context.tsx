'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  ContentType,
  Field,
  Relationship,
  FieldType,
  RelationshipType,
  generateId,
  createField,
  createContentType,
} from '@/lib/content-types/types';

interface ContentTypeContextValue {
  // Content Types
  contentTypes: ContentType[];
  currentContentType: ContentType | null;
  setCurrentContentType: (contentType: ContentType | null) => void;
  createContentType: (name: string) => ContentType;
  updateContentType: (id: string, updates: Partial<ContentType>) => void;
  deleteContentType: (id: string) => void;
  
  // Fields
  addField: (contentTypeId: string, fieldType: FieldType) => void;
  updateField: (contentTypeId: string, fieldId: string, updates: Partial<Field>) => void;
  deleteField: (contentTypeId: string, fieldId: string) => void;
  reorderFields: (contentTypeId: string, fields: Field[]) => void;
  
  // Relationships
  addRelationship: (contentTypeId: string, relationship: Omit<Relationship, 'id'>) => void;
  updateRelationship: (contentTypeId: string, relationshipId: string, updates: Partial<Relationship>) => void;
  deleteRelationship: (contentTypeId: string, relationshipId: string) => void;
  
  // Utility
  isDirty: boolean;
  setIsDirty: (isDirty: boolean) => void;
}

const ContentTypeContext = createContext<ContentTypeContextValue | undefined>(undefined);

export function ContentTypeProvider({ children }: { children: React.ReactNode }) {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [currentContentType, setCurrentContentType] = useState<ContentType | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  // Try to integrate with ProjectContext if it exists
  let projectContext = null;
  try {
    const { useProjectContext: useProject } = require('@/lib/context/project-context');
    projectContext = useProject();
  } catch {
    // ProjectContext not available
  }
  
  // Load content types from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('contentTypes');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const contentTypes = parsed.map((ct: any) => ({
          ...ct,
          createdAt: new Date(ct.createdAt),
          updatedAt: new Date(ct.updatedAt),
        }));
        setContentTypes(contentTypes);
      } catch (error) {
        console.error('Failed to load content types:', error);
      }
    }
  }, []);
  
  // Save content types to localStorage when they change
  useEffect(() => {
    if (contentTypes.length > 0) {
      localStorage.setItem('contentTypes', JSON.stringify(contentTypes));
      setIsDirty(false);
      
      // Update project context if available
      if (projectContext?.updateProject) {
        projectContext.updateProject({
          contentTypes,
        });
      }
    }
  }, [contentTypes, projectContext]);
  
  // Content Type CRUD operations
  const createContentTypeHandler = useCallback((name: string): ContentType => {
    const newContentType = createContentType(name);
    setContentTypes(prev => [...prev, newContentType]);
    setCurrentContentType(newContentType);
    setIsDirty(true);
    return newContentType;
  }, []);
  
  const updateContentTypeHandler = useCallback((id: string, updates: Partial<ContentType>) => {
    setContentTypes(prev => prev.map(ct => 
      ct.id === id 
        ? { ...ct, ...updates, updatedAt: new Date() }
        : ct
    ));
    
    if (currentContentType?.id === id) {
      setCurrentContentType(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    }
    setIsDirty(true);
  }, [currentContentType]);
  
  const deleteContentTypeHandler = useCallback((id: string) => {
    setContentTypes(prev => prev.filter(ct => ct.id !== id));
    if (currentContentType?.id === id) {
      setCurrentContentType(null);
    }
    setIsDirty(true);
  }, [currentContentType]);
  
  // Field management functions
  const addFieldHandler = useCallback((contentTypeId: string, fieldType: FieldType) => {
    setContentTypes(prev => prev.map(ct => {
      if (ct.id === contentTypeId) {
        const order = ct.fields.length;
        const newField = createField(fieldType, order);
        return {
          ...ct,
          fields: [...ct.fields, newField],
          updatedAt: new Date(),
        };
      }
      return ct;
    }));
    
    if (currentContentType?.id === contentTypeId) {
      setCurrentContentType(prev => {
        if (!prev) return null;
        const order = prev.fields.length;
        const newField = createField(fieldType, order);
        return {
          ...prev,
          fields: [...prev.fields, newField],
          updatedAt: new Date(),
        };
      });
    }
    setIsDirty(true);
  }, [currentContentType]);
  
  const updateFieldHandler = useCallback((contentTypeId: string, fieldId: string, updates: Partial<Field>) => {
    setContentTypes(prev => prev.map(ct => {
      if (ct.id === contentTypeId) {
        return {
          ...ct,
          fields: ct.fields.map(field => 
            field.id === fieldId ? { ...field, ...updates } : field
          ),
          updatedAt: new Date(),
        };
      }
      return ct;
    }));
    
    if (currentContentType?.id === contentTypeId) {
      setCurrentContentType(prev => {
        if (!prev) return null;
        return {
          ...prev,
          fields: prev.fields.map(field => 
            field.id === fieldId ? { ...field, ...updates } : field
          ),
          updatedAt: new Date(),
        };
      });
    }
    setIsDirty(true);
  }, [currentContentType]);
  
  const deleteFieldHandler = useCallback((contentTypeId: string, fieldId: string) => {
    setContentTypes(prev => prev.map(ct => {
      if (ct.id === contentTypeId) {
        const updatedFields = ct.fields
          .filter(field => field.id !== fieldId)
          .map((field, index) => ({ ...field, order: index }));
        return {
          ...ct,
          fields: updatedFields,
          updatedAt: new Date(),
        };
      }
      return ct;
    }));
    
    if (currentContentType?.id === contentTypeId) {
      setCurrentContentType(prev => {
        if (!prev) return null;
        const updatedFields = prev.fields
          .filter(field => field.id !== fieldId)
          .map((field, index) => ({ ...field, order: index }));
        return {
          ...prev,
          fields: updatedFields,
          updatedAt: new Date(),
        };
      });
    }
    setIsDirty(true);
  }, [currentContentType]);
  
  const reorderFieldsHandler = useCallback((contentTypeId: string, fields: Field[]) => {
    const reorderedFields = fields.map((field, index) => ({ ...field, order: index }));
    
    setContentTypes(prev => prev.map(ct => {
      if (ct.id === contentTypeId) {
        return {
          ...ct,
          fields: reorderedFields,
          updatedAt: new Date(),
        };
      }
      return ct;
    }));
    
    if (currentContentType?.id === contentTypeId) {
      setCurrentContentType(prev => {
        if (!prev) return null;
        return {
          ...prev,
          fields: reorderedFields,
          updatedAt: new Date(),
        };
      });
    }
    setIsDirty(true);
  }, [currentContentType]);
  
  // Relationship management functions
  const addRelationshipHandler = useCallback((contentTypeId: string, relationship: Omit<Relationship, 'id'>) => {
    const newRelationship: Relationship = {
      ...relationship,
      id: generateId(),
    };
    
    setContentTypes(prev => prev.map(ct => {
      if (ct.id === contentTypeId) {
        return {
          ...ct,
          relationships: [...ct.relationships, newRelationship],
          updatedAt: new Date(),
        };
      }
      return ct;
    }));
    
    if (currentContentType?.id === contentTypeId) {
      setCurrentContentType(prev => {
        if (!prev) return null;
        return {
          ...prev,
          relationships: [...prev.relationships, newRelationship],
          updatedAt: new Date(),
        };
      });
    }
    setIsDirty(true);
  }, [currentContentType]);
  
  const updateRelationshipHandler = useCallback((contentTypeId: string, relationshipId: string, updates: Partial<Relationship>) => {
    setContentTypes(prev => prev.map(ct => {
      if (ct.id === contentTypeId) {
        return {
          ...ct,
          relationships: ct.relationships.map(rel => 
            rel.id === relationshipId ? { ...rel, ...updates } : rel
          ),
          updatedAt: new Date(),
        };
      }
      return ct;
    }));
    
    if (currentContentType?.id === contentTypeId) {
      setCurrentContentType(prev => {
        if (!prev) return null;
        return {
          ...prev,
          relationships: prev.relationships.map(rel => 
            rel.id === relationshipId ? { ...rel, ...updates } : rel
          ),
          updatedAt: new Date(),
        };
      });
    }
    setIsDirty(true);
  }, [currentContentType]);
  
  const deleteRelationshipHandler = useCallback((contentTypeId: string, relationshipId: string) => {
    setContentTypes(prev => prev.map(ct => {
      if (ct.id === contentTypeId) {
        return {
          ...ct,
          relationships: ct.relationships.filter(rel => rel.id !== relationshipId),
          updatedAt: new Date(),
        };
      }
      return ct;
    }));
    
    if (currentContentType?.id === contentTypeId) {
      setCurrentContentType(prev => {
        if (!prev) return null;
        return {
          ...prev,
          relationships: prev.relationships.filter(rel => rel.id !== relationshipId),
          updatedAt: new Date(),
        };
      });
    }
    setIsDirty(true);
  }, [currentContentType]);
  
  const value: ContentTypeContextValue = {
    contentTypes,
    currentContentType,
    setCurrentContentType,
    createContentType: createContentTypeHandler,
    updateContentType: updateContentTypeHandler,
    deleteContentType: deleteContentTypeHandler,
    addField: addFieldHandler,
    updateField: updateFieldHandler,
    deleteField: deleteFieldHandler,
    reorderFields: reorderFieldsHandler,
    addRelationship: addRelationshipHandler,
    updateRelationship: updateRelationshipHandler,
    deleteRelationship: deleteRelationshipHandler,
    isDirty,
    setIsDirty,
  };
  
  return (
    <ContentTypeContext.Provider value={value}>
      {children}
    </ContentTypeContext.Provider>
  );
}

export function useContentTypes() {
  const context = useContext(ContentTypeContext);
  if (context === undefined) {
    throw new Error('useContentTypes must be used within a ContentTypeProvider');
  }
  return context;
}