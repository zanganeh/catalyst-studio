import { CreateContentTypeRequest, UpdateContentTypeRequest } from '@/lib/api/validation/content-type';
import prisma from '@/lib/db/prisma';
import { VersionHistoryManager } from '@/lib/sync/versioning/VersionHistoryManager';
import { VersionTree } from '@/lib/sync/versioning/VersionTree';
import { VersionDiff } from '@/lib/sync/versioning/VersionDiff';

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
    fields: (ct.fields as ContentTypeFields) || {},
    settings: (ct.schema as ContentTypeSettings) || {},
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
    fields: (contentType.fields as ContentTypeFields) || {},
    settings: (contentType.schema as ContentTypeSettings) || {},
  };
}

export async function createContentType(data: CreateContentTypeRequest, source: 'UI' | 'AI' | 'SYNC' = 'UI'): Promise<ContentTypeWithParsedFields> {
  const { websiteId, fields, relationships, ...contentTypeData } = data;

  // Generate a key from the name (lowercase, replace spaces with underscores)
  const key = contentTypeData.name.toLowerCase().replace(/\s+/g, '_');

  const contentTypeFields = {
    name: contentTypeData.name,
    pluralName: contentTypeData.pluralName,
    icon: contentTypeData.icon,
    description: contentTypeData.description,
    fields,
    relationships,
  };

  // Create schema from fields
  const schema = {
    fields: fields || [],
    relationships: relationships || []
  };

  const settings = {
    pluralName: contentTypeData.pluralName,
    icon: contentTypeData.icon,
    description: contentTypeData.description,
  };

  const contentType = await prisma.contentType.create({
    data: {
      websiteId: websiteId || 'default',
      key,
      name: contentTypeData.name,
      pluralName: contentTypeData.pluralName,
      displayField: fields && fields.length > 0 ? fields[0].name : null,
      schema: schema as any,
      fields: contentTypeFields as any,
    },
  });

  // Track version history for the new content type
  const versionManager = new VersionHistoryManager(prisma);
  await versionManager.onDataChange(
    {
      key: contentType.id,
      ...contentTypeFields
    },
    source,
    undefined,
    'Content type created'
  );

  return {
    ...contentType,
    fields: contentTypeFields as any,
    settings: settings as any,
  };
}

export async function updateContentType(id: string, data: UpdateContentTypeRequest, source: 'UI' | 'AI' | 'SYNC' = 'UI'): Promise<ContentTypeWithParsedFields> {
  const existing = await getContentType(id);
  if (!existing) {
    throw new Error(`Content type with ID '${id}' not found`);
  }

  const currentFields = existing.fields || {};
  const currentSettings = existing.settings || {};

  const { fields, relationships, ...contentTypeData } = data;

  // Fix: Properly merge fields array instead of nesting it  
  let updatedFields = {
    ...currentFields,
    ...(contentTypeData.name && { name: contentTypeData.name }),
    ...(contentTypeData.pluralName && { pluralName: contentTypeData.pluralName }),
    ...(contentTypeData.icon && { icon: contentTypeData.icon }),
    ...(contentTypeData.description !== undefined && { description: contentTypeData.description }),
    fields: fields !== undefined ? fields : (currentFields.fields || []),
    relationships: relationships !== undefined ? relationships : (currentFields.relationships || []),
  };

  const updatedSettings = {
    ...currentSettings,
    ...(contentTypeData.pluralName && { pluralName: contentTypeData.pluralName }),
    ...(contentTypeData.icon && { icon: contentTypeData.icon }),
    ...(contentTypeData.description !== undefined && { description: contentTypeData.description }),
    ...(data.settings && data.settings),
  };

  // Create updated schema from fields
  const updatedSchema = {
    fields: updatedFields.fields || [],
    relationships: updatedFields.relationships || []
  };

  const contentType = await prisma.contentType.update({
    where: { id },
    data: {
      ...(contentTypeData.name && { name: contentTypeData.name }),
      ...(contentTypeData.pluralName && { pluralName: contentTypeData.pluralName }),
      fields: updatedFields as any,
      schema: updatedSchema as any,
    },
  });

  // Track version history for the updated content type
  const versionManager = new VersionHistoryManager(prisma);
  await versionManager.onDataChange(
    {
      key: contentType.id,
      ...updatedFields
    },
    source,
    undefined,
    'Content type updated'
  );

  return {
    ...contentType,
    fields: updatedFields as any,
    settings: updatedSettings as any,
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

/**
 * Get version history for a content type
 * @param typeKey - The content type ID or key
 * @param options - Options for filtering version history
 * @returns Array of version records
 */
export async function getVersionHistory(typeKey: string, options?: {
  author?: string;
  dateRange?: { start: string | Date; end: string | Date };
  source?: 'UI' | 'AI' | 'SYNC';
  limit?: number;
}) {
  const versionManager = new VersionHistoryManager(prisma);
  return await versionManager.getVersionHistory(typeKey, options || {});
}

/**
 * Get version tree for a content type
 * @param typeKey - The content type ID or key
 * @returns Version tree structure
 */
export async function getVersionTree(typeKey: string) {
  const versionTree = new VersionTree(prisma);
  return await versionTree.buildTree(typeKey);
}

/**
 * Compare two versions of a content type
 * @param hash1 - First version hash
 * @param hash2 - Second version hash
 * @returns Diff result
 */
export async function compareVersions(hash1: string, hash2: string) {
  const versionManager = new VersionHistoryManager(prisma);
  const version1 = await versionManager.getVersionByHash(hash1);
  const version2 = await versionManager.getVersionByHash(hash2);
  
  if (!version1 || !version2) {
    throw new Error('One or both versions not found');
  }
  
  const versionDiff = new VersionDiff();
  return versionDiff.calculateDiff(
    version1.data,
    version2.data
  );
}

/**
 * Get lineage for a specific version
 * @param hash - Version hash
 * @returns Array of version hashes from current to root
 */
export async function getVersionLineage(hash: string) {
  const versionTree = new VersionTree(prisma);
  return await versionTree.getLineage(hash);
}