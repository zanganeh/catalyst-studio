import { VersionDiff } from '../VersionDiff';

describe('VersionDiff', () => {
  let versionDiff: VersionDiff;

  beforeEach(() => {
    versionDiff = new VersionDiff();
  });

  describe('calculateDiff', () => {
    it('should identify field additions', () => {
      const v1 = {
        fields: [
          { name: 'title', type: 'string' }
        ]
      };
      const v2 = {
        fields: [
          { name: 'title', type: 'string' },
          { name: 'body', type: 'text' }
        ]
      };

      const diff = versionDiff.calculateDiff(v1, v2);

      expect(diff.added).toHaveLength(1);
      expect(diff.added[0].name).toBe('body');
      expect(diff.modified).toHaveLength(0);
      expect(diff.removed).toHaveLength(0);
      expect(diff.unchanged).toHaveLength(1);
    });

    it('should detect field modifications', () => {
      const v1 = {
        fields: [
          { name: 'title', type: 'string', validation: { maxLength: 100 } }
        ]
      };
      const v2 = {
        fields: [
          { name: 'title', type: 'string', validation: { maxLength: 200 } }
        ]
      };

      const diff = versionDiff.calculateDiff(v1, v2);

      expect(diff.modified).toHaveLength(1);
      expect(diff.modified[0].name).toBe('title');
      expect(diff.added).toHaveLength(0);
      expect(diff.removed).toHaveLength(0);
      expect(diff.unchanged).toHaveLength(0);
    });

    it('should identify field removals', () => {
      const v1 = {
        fields: [
          { name: 'title', type: 'string' },
          { name: 'deprecated', type: 'boolean' }
        ]
      };
      const v2 = {
        fields: [
          { name: 'title', type: 'string' }
        ]
      };

      const diff = versionDiff.calculateDiff(v1, v2);

      expect(diff.removed).toHaveLength(1);
      expect(diff.removed[0].name).toBe('deprecated');
      expect(diff.added).toHaveLength(0);
      expect(diff.modified).toHaveLength(0);
      expect(diff.unchanged).toHaveLength(1);
    });

    it('should handle JSON string inputs', () => {
      const v1 = JSON.stringify({
        fields: [{ name: 'title', type: 'string' }]
      });
      const v2 = JSON.stringify({
        fields: [
          { name: 'title', type: 'string' },
          { name: 'body', type: 'text' }
        ]
      });

      const diff = versionDiff.calculateDiff(v1, v2);

      expect(diff.added).toHaveLength(1);
      expect(diff.added[0].name).toBe('body');
    });

    it('should handle empty field arrays', () => {
      const v1 = { fields: [] };
      const v2 = { fields: [] };

      const diff = versionDiff.calculateDiff(v1, v2);

      expect(diff.added).toHaveLength(0);
      expect(diff.modified).toHaveLength(0);
      expect(diff.removed).toHaveLength(0);
      expect(diff.unchanged).toHaveLength(0);
    });
  });

  describe('formatDiff', () => {
    it('should format diff with all change types', () => {
      const diff = {
        added: [{ name: 'newField', type: 'string' }],
        modified: [{ name: 'changedField', type: 'number' }],
        removed: [{ name: 'oldField', type: 'boolean' }],
        unchanged: [{ name: 'sameField', type: 'text' }]
      };

      const formatted = versionDiff.formatDiff(diff);

      expect(formatted).toContain('## Added Fields');
      expect(formatted).toContain('+ newField (string)');
      expect(formatted).toContain('## Modified Fields');
      expect(formatted).toContain('~ changedField (number)');
      expect(formatted).toContain('## Removed Fields');
      expect(formatted).toContain('- oldField (boolean)');
      expect(formatted).toContain('## Unchanged Fields (1)');
      expect(formatted).toContain('sameField');
    });

    it('should handle empty diff', () => {
      const diff = {
        added: [],
        modified: [],
        removed: [],
        unchanged: []
      };

      const formatted = versionDiff.formatDiff(diff);

      expect(formatted).toBe('No differences found');
    });
  });

  describe('threeWayDiff', () => {
    it('should detect conflicts when both sides modify same field', () => {
      const base = {
        fields: [
          { name: 'title', type: 'string', validation: { maxLength: 100 } }
        ]
      };
      const local = {
        fields: [
          { name: 'title', type: 'string', validation: { maxLength: 200 } }
        ]
      };
      const remote = {
        fields: [
          { name: 'title', type: 'string', validation: { maxLength: 150 } }
        ]
      };

      const threeWay = versionDiff.threeWayDiff(base, local, remote);

      expect(threeWay.conflicts).toHaveLength(1);
      expect(threeWay.conflicts[0].name).toBe('title');
    });

    it('should handle non-conflicting changes', () => {
      const base = {
        fields: [
          { name: 'title', type: 'string' }
        ]
      };
      const local = {
        fields: [
          { name: 'title', type: 'string' },
          { name: 'localField', type: 'number' }
        ]
      };
      const remote = {
        fields: [
          { name: 'title', type: 'string' },
          { name: 'remoteField', type: 'boolean' }
        ]
      };

      const threeWay = versionDiff.threeWayDiff(base, local, remote);

      expect(threeWay.conflicts).toHaveLength(0);
      expect(threeWay.localChanges).toHaveLength(1);
      expect(threeWay.localChanges[0].name).toBe('localField');
      expect(threeWay.remoteChanges).toHaveLength(1);
      expect(threeWay.remoteChanges[0].name).toBe('remoteField');
    });

    it('should merge non-conflicting changes', () => {
      const base = {
        fields: [
          { name: 'title', type: 'string' }
        ]
      };
      const local = {
        fields: [
          { name: 'title', type: 'string' },
          { name: 'author', type: 'string' }
        ]
      };
      const remote = {
        fields: [
          { name: 'title', type: 'string' },
          { name: 'date', type: 'date' }
        ]
      };

      const threeWay = versionDiff.threeWayDiff(base, local, remote);

      expect(threeWay.mergedResult.fields).toHaveLength(3);
      const fieldNames = threeWay.mergedResult.fields.map((f: any) => f.name);
      expect(fieldNames).toContain('title');
      expect(fieldNames).toContain('author');
      expect(fieldNames).toContain('date');
    });
  });
});