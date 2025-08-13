import { PrismaClient } from '@/lib/generated/prisma';
import { CreateContentTypeRequest, UpdateContentTypeRequest } from '@/lib/api/validation/content-type';

const prisma = new PrismaClient();

export interface ContentTypeWithParsedFields {
  id: string;
  websiteId: string;
  name: string;
  fields: any;
  settings: any;
  createdAt: Date;
  updatedAt: Date;
}

function parseJsonField(field: string | null): any {
  if (!field) return null;
  try {
    return JSON.parse(field);
  } catch {
    return null;
  }
}

function stringifyJsonField(field: any): string {
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
    fields: parseJsonField(ct.fields) || [],
    settings: parseJsonField(ct.settings) || {},
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
    fields: parseJsonField(contentType.fields) || [],
    settings: parseJsonField(contentType.settings) || {},
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
    throw new Error('Content type not found');
  }

  const currentFields = existing.fields || {};
  const currentSettings = existing.settings || {};

  const { fields, relationships, ...contentTypeData } = data;

  const updatedFields = fields !== undefined 
    ? { ...currentFields, fields, relationships }
    : currentFields;

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