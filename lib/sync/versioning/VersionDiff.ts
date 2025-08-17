export interface Field {
  name: string;
  type?: string;
  value?: unknown;
  validation?: unknown;
  settings?: unknown;
}

export interface DiffResult {
  added: Field[];
  modified: Field[];
  removed: Field[];
  unchanged: Field[];
}

export interface ThreeWayDiff {
  conflicts: Field[];
  localChanges: Field[];
  remoteChanges: Field[];
  mergedResult: unknown;
}

export class VersionDiff {
  /**
   * Calculate the difference between two content type versions
   * @param version1 - The first version (older)
   * @param version2 - The second version (newer)
   * @returns The diff result with added, modified, removed, and unchanged fields
   */
  calculateDiff(version1: unknown, version2: unknown): DiffResult {
    const diff: DiffResult = {
      added: [],
      modified: [],
      removed: [],
      unchanged: []
    };

    const v1 = typeof version1 === 'string' ? JSON.parse(version1) : version1;
    const v2 = typeof version2 === 'string' ? JSON.parse(version2) : version2;

    const fields1 = this.extractFields(v1);
    const fields2 = this.extractFields(v2);

    const fieldMap1 = new Map(fields1.map(f => [f.name, f]));
    const fieldMap2 = new Map(fields2.map(f => [f.name, f]));

    for (const [name, field2] of fieldMap2) {
      const field1 = fieldMap1.get(name);
      
      if (!field1) {
        diff.added.push(field2);
      } else if (this.areFieldsDifferent(field1, field2)) {
        diff.modified.push(field2);
      } else {
        diff.unchanged.push(field2);
      }
    }

    for (const [name, field1] of fieldMap1) {
      if (!fieldMap2.has(name)) {
        diff.removed.push(field1);
      }
    }

    return diff;
  }

  /**
   * Format diff result as human-readable string
   * @param diff - The diff result
   * @returns Formatted string representation
   */
  formatDiff(diff: DiffResult): string {
    let result = '';

    if (diff.added.length > 0) {
      result += '## Added Fields\n';
      diff.added.forEach(field => {
        result += `+ ${field.name} (${field.type || 'unknown type'})\n`;
      });
      result += '\n';
    }

    if (diff.modified.length > 0) {
      result += '## Modified Fields\n';
      diff.modified.forEach(field => {
        result += `~ ${field.name} (${field.type || 'unknown type'})\n`;
      });
      result += '\n';
    }

    if (diff.removed.length > 0) {
      result += '## Removed Fields\n';
      diff.removed.forEach(field => {
        result += `- ${field.name} (${field.type || 'unknown type'})\n`;
      });
      result += '\n';
    }

    if (diff.unchanged.length > 0) {
      result += `## Unchanged Fields (${diff.unchanged.length})\n`;
      diff.unchanged.forEach(field => {
        result += `  ${field.name}\n`;
      });
    }

    return result || 'No differences found';
  }

  /**
   * Calculate three-way diff for merge scenarios
   * @param base - The common ancestor version
   * @param local - The local version
   * @param remote - The remote version
   * @returns Three-way diff result with conflicts and merged result
   */
  threeWayDiff(base: unknown, local: unknown, remote: unknown): ThreeWayDiff {
    const baseFields = this.extractFields(base);
    const localFields = this.extractFields(local);
    const remoteFields = this.extractFields(remote);

    const baseMap = new Map(baseFields.map(f => [f.name, f]));
    const localMap = new Map(localFields.map(f => [f.name, f]));
    const remoteMap = new Map(remoteFields.map(f => [f.name, f]));

    const conflicts: Field[] = [];
    const localChanges: Field[] = [];
    const remoteChanges: Field[] = [];
    const mergedFields: Field[] = [];

    const allFieldNames = new Set([
      ...baseMap.keys(),
      ...localMap.keys(),
      ...remoteMap.keys()
    ]);

    for (const fieldName of allFieldNames) {
      const baseField = baseMap.get(fieldName);
      const localField = localMap.get(fieldName);
      const remoteField = remoteMap.get(fieldName);

      if (localField && remoteField) {
        const localChanged = !baseField || this.areFieldsDifferent(baseField, localField);
        const remoteChanged = !baseField || this.areFieldsDifferent(baseField, remoteField);

        if (localChanged && remoteChanged) {
          if (this.areFieldsDifferent(localField, remoteField)) {
            conflicts.push(localField);
            mergedFields.push(localField);
          } else {
            mergedFields.push(localField);
          }
        } else if (localChanged) {
          localChanges.push(localField);
          mergedFields.push(localField);
        } else if (remoteChanged) {
          remoteChanges.push(remoteField);
          mergedFields.push(remoteField);
        } else {
          mergedFields.push(localField);
        }
      } else if (localField && !remoteField) {
        if (!baseField) {
          localChanges.push(localField);
          mergedFields.push(localField);
        }
      } else if (!localField && remoteField) {
        if (!baseField) {
          remoteChanges.push(remoteField);
          mergedFields.push(remoteField);
        }
      }
    }

    const mergedResult = this.reconstructContentType(
      typeof local === 'string' ? JSON.parse(local) : local,
      mergedFields
    );

    return {
      conflicts,
      localChanges,
      remoteChanges,
      mergedResult
    };
  }

  /**
   * Extract fields from a content type structure
   * @param contentType - The content type
   * @returns Array of fields
   */
  private extractFields(contentType: unknown): Field[] {
    if (!contentType) return [];
    
    const ct = typeof contentType === 'string' ? JSON.parse(contentType) : contentType;
    
    if (ct && typeof ct === 'object' && 'fields' in ct && Array.isArray((ct as Record<string, unknown>).fields)) {
      return ((ct as Record<string, unknown>).fields as unknown[]).map((field: unknown) => {
        const f = field as Record<string, unknown>;
        return {
          name: (f.name || f.id) as string,
          type: f.type as string | undefined,
          value: f.value,
          validation: f.validation,
          settings: f.settings
        };
      });
    }
    
    return [];
  }

  /**
   * Check if two fields are different
   * @param field1 - First field
   * @param field2 - Second field
   * @returns True if fields are different
   */
  private areFieldsDifferent(field1: Field, field2: Field): boolean {
    return (
      field1.type !== field2.type ||
      JSON.stringify(field1.validation) !== JSON.stringify(field2.validation) ||
      JSON.stringify(field1.settings) !== JSON.stringify(field2.settings) ||
      JSON.stringify(field1.value) !== JSON.stringify(field2.value)
    );
  }

  /**
   * Reconstruct content type with merged fields
   * @param original - Original content type structure
   * @param mergedFields - Merged fields
   * @returns Reconstructed content type
   */
  private reconstructContentType(original: unknown, mergedFields: Field[]): unknown {
    const result = { ...(original as Record<string, unknown>) };
    result.fields = mergedFields.map(field => ({
      name: field.name,
      type: field.type,
      validation: field.validation,
      settings: field.settings,
      value: field.value
    }));
    return result;
  }
}