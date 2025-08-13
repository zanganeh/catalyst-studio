import { CreateContentTypeRequest, UpdateContentTypeRequest } from '@/lib/api/validation/content-type';
import prisma from '@/lib/db/prisma';

export interface ContentTypeFields {
  name?: string;
  pluralName?: string;
  icon?: string;
  description?: string;
  fields?: Array<{
    id: string;
    name: string;
    label: string;
    type: string;
    required: boolean;
    defaultValue?: unknown;
    validation?: Record<string, unknown>;
    helpText?: string;
    placeholder?: string;
    options?: Array<{
      label: string;
      value: string | number | boolean;
      description?: string;
    }>;
    order: number;
  }>;
  relationships?: Array<{
    id: string;
    name: string;
    type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
    sourceContentTypeId: string;
    targetContentTypeId: string;
    sourceFieldName?: string;
    targetFieldName?: string;
    fieldName?: string;
    isRequired: boolean;
  }>;
}

export interface ContentTypeSettings {
  pluralName?: string;
  icon?: string;
  description?: string;
  [key: string]: unknown;
}

export interface ContentTypeWithParsedFields {
  id: string;
  websiteId: string;
  name: string;
  fields: ContentTypeFields;
  settings: ContentTypeSettings;
  createdAt: Date;
  updatedAt: Date;
}

function parseJsonField<T = ContentTypeFields | ContentTypeSettings>(field: string | null): T | null {
  if (!field) return null;
  try {
    return JSON.parse(field) as T;
  } catch {
    return null;
  }
}

function stringifyJsonField(field: ContentTypeFields | ContentTypeSettings | null | undefined): string {
  if (field === null || field === undefined) return '{}';
  return JSON.stringify(field);
}

export async function getContentTypes(websiteId?: string): Promise<ContentTypeWithParsedFields[]> {
  const contentTypes = await prisma.contentType.findMany({
    where: websiteId ? { websiteId } : undefined,
    orderBy: { updatedAt: 'desc' },
  });

  return contentTypes.map(ct => ({
    ...ct,
    fields: parseJsonField<ContentTypeFields>(ct.fields) || {},
    settings: parseJsonField<ContentTypeSettings>(ct.settings) || {},
  }));
}

export async function getContentType(id: string): Promise<ContentTypeWithParsedFields | null> {
  const contentType = await prisma.contentType.findUnique({
    where: { id },
  });

  if (!contentType) {
    return null;
  }

  return {
    ...contentType,
    fields: parseJsonField<ContentTypeFields>(contentType.fields) || {},
    settings: parseJsonField<ContentTypeSettings>(contentType.settings) || {},
  };
}

export async function createContentType(data: CreateContentTypeRequest): Promise<ContentTypeWithParsedFields> {
  const { websiteId, fields, relationships, ...contentTypeData } = data;

  const contentTypeFields = {
    ...contentTypeData,
    fields,
    relationships,
  };

  const settings = {
    pluralName: contentTypeData.pluralName,
    icon: contentTypeData.icon,
    description: contentTypeData.description,
  };

  const contentType = await prisma.contentType.create({
    data: {
      websiteId: websiteId || 'default',
      name: contentTypeData.name,
      fields: stringifyJsonField(contentTypeFields),
      settings: stringifyJsonField(settings),
    },
  });

  return {
    ...contentType,
    fields: contentTypeFields,
    settings,
  };
}

export async function updateContentType(id: string, data: UpdateContentTypeRequest): Promise<ContentTypeWithParsedFields> {
  const existing = await getContentType(id);
  if (!existing) {
    throw new Error(`Content type with ID '${id}' not found`);
  }

  const currentFields = existing.fields || {};
  const currentSettings = existing.settings || {};

  const { fields, relationships, ...contentTypeData } = data;

  // Fix: Properly merge fields array instead of nesting it
  let updatedFields = currentFields;
  if (fields !== undefined || relationships !== undefined) {
    updatedFields = {
      ...currentFields,
      ...(fields !== undefined && { fields }),
      ...(relationships !== undefined && { relationships }),
    };
  }

  const updatedSettings = {
    ...currentSettings,
    ...(contentTypeData.pluralName && { pluralName: contentTypeData.pluralName }),
    ...(contentTypeData.icon && { icon: contentTypeData.icon }),
    ...(contentTypeData.description !== undefined && { description: contentTypeData.description }),
    ...(data.settings && data.settings),
  };

  const contentType = await prisma.contentType.update({
    where: { id },
    data: {
      ...(contentTypeData.name && { name: contentTypeData.name }),
      fields: stringifyJsonField(updatedFields),
      settings: stringifyJsonField(updatedSettings),
    },
  });

  return {
    ...contentType,
    fields: updatedFields,
    settings: updatedSettings,
  };
}

export async function deleteContentType(id: string): Promise<void> {
  const contentItemsCount = await prisma.contentItem.count({
    where: { contentTypeId: id },
  });

  if (contentItemsCount > 0) {
    throw new Error(`Cannot delete content type with ${contentItemsCount} existing content items`);
  }

  await prisma.contentType.delete({
    where: { id },
  });
}