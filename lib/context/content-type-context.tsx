'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  ContentType,
  Field,
  Relationship,
  FieldType,
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
  
  // Use refs to maintain current values without causing re-renders
  const contentTypesRef = useRef(contentTypes);
  const currentContentTypeRef = useRef(currentContentType);
  
  // Update refs when state changes
  useEffect(() => {
    contentTypesRef.current = contentTypes;
  }, [contentTypes]);
  
  useEffect(() => {
    currentContentTypeRef.current = currentContentType;
  }, [currentContentType]);
  
  // Load content types from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('contentTypes');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Convert date strings back to Date objects and remove duplicates
          const contentTypesMap = new Map();
          parsed.forEach((ct: any) => {
            // Keep the content type with more fields if there are duplicates with same name
            const existing = contentTypesMap.get(ct.name);
            if (!existing || ct.fields.length > existing.fields.length) {
              contentTypesMap.set(ct.name, {
                ...ct,
                createdAt: new Date(ct.createdAt),
                updatedAt: new Date(ct.updatedAt),
              });
            }
          });
          const uniqueContentTypes = Array.from(contentTypesMap.values());
          setContentTypes(uniqueContentTypes);
          
          // If we cleaned up duplicates, save the cleaned version
          if (uniqueContentTypes.length < parsed.length) {
            localStorage.setItem('contentTypes', JSON.stringify(uniqueContentTypes));
          }
        } catch (error) {
          console.error('Failed to load content types:', error);
        }
      }
    }
  }, []);
  
  // Save function that can be called explicitly
  const saveToLocalStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      console.log('Saving content types to localStorage:', contentTypes);
      localStorage.setItem('contentTypes', JSON.stringify(contentTypes));
      setIsDirty(false);
    }
  }, [contentTypes]);

  // Save content types to localStorage when they change (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined' && isDirty) {
      const timeoutId = setTimeout(() => {
        saveToLocalStorage();
      }, 500); // Debounce saves by 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [contentTypes, isDirty, saveToLocalStorage]);
  
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
    setContentTypes(prev => {
      // Find the content type and calculate order
      const targetContentType = prev.find(ct => ct.id === contentTypeId);
      const order = targetContentType?.fields.length || 0;
      const newField = createField(fieldType, order);
      
      // Update contentTypes
      const updatedContentTypes = prev.map(ct => {
        if (ct.id === contentTypeId) {
          return {
            ...ct,
            fields: [...ct.fields, newField],
            updatedAt: new Date(),
          };
        }
        return ct;
      });
      
      // Save immediately to localStorage
      if (typeof window !== 'undefined') {
        console.log('Saving after field add:', updatedContentTypes);
        localStorage.setItem('contentTypes', JSON.stringify(updatedContentTypes));
      }
      
      // Update currentContentType if it matches
      if (currentContentTypeRef.current?.id === contentTypeId) {
        const updated = updatedContentTypes.find(ct => ct.id === contentTypeId);
        if (updated) {
          // Need to update currentContentType in a separate effect
          setTimeout(() => setCurrentContentType(updated), 0);
        }
      }
      
      return updatedContentTypes;
    });
    
    setIsDirty(true);
  }, []);
  
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