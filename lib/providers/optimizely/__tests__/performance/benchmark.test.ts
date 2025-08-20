import { OptimizelyProvider } from '../../OptimizelyProvider';
import { OptimizelyContentType } from '../../types';
import { UniversalContentType } from '../../../universal/types';

describe('OptimizelyProvider Performance Benchmarks', () => {
  let provider: OptimizelyProvider;
  
  beforeEach(() => {
    provider = new OptimizelyProvider();
  });

  describe('Type Transformation Performance', () => {
    const createOptimizelyType = (index: number): OptimizelyContentType => ({
      key: `ContentType${index}`,
      displayName: `Content Type ${index}`,
      description: `Description for type ${index}`,
      baseType: index % 2 === 0 ? '_page' : '_component',
      source: 'test',
      sortOrder: index,
      mayContainTypes: [],
      properties: {
        title: {
          type: 'String',
          displayName: 'Title',
          required: true
        },
        content: {
          type: 'XhtmlString',
          displayName: 'Content',
          required: false
        },
        author: {
          type: 'String',
          displayName: 'Author',
          required: true
        },
        tags: {
          type: 'SelectMany',
          displayName: 'Tags',
          required: false
        },
        publishDate: {
          type: 'DateTime',
          displayName: 'Publish Date',
          required: false
        }
      }
    });

    it('should transform 100 content types within acceptable time', () => {
      const types: OptimizelyContentType[] = [];
      for (let i = 0; i < 100; i++) {
        types.push(createOptimizelyType(i));
      }

      const startTime = performance.now();
      
      const universalTypes = types.map(type => provider.mapToUniversal(type));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Transformed 100 types to Universal in ${duration.toFixed(2)}ms`);
      
      // Should complete within 100ms
      expect(duration).toBeLessThan(100);
      expect(universalTypes).toHaveLength(100);
    });

    it('should handle round-trip transformation efficiently', () => {
      const types: OptimizelyContentType[] = [];
      for (let i = 0; i < 50; i++) {
        types.push(createOptimizelyType(i));
      }

      const startTime = performance.now();
      
      // Round-trip: Optimizely -> Universal -> Optimizely
      const roundTripTypes = types.map(type => {
        const universal = provider.mapToUniversal(type);
        return provider.mapFromUniversal(universal);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Round-trip transformation of 50 types in ${duration.toFixed(2)}ms`);
      
      // Should complete within 100ms
      expect(duration).toBeLessThan(100);
      expect(roundTripTypes).toHaveLength(50);
      
      // Verify data integrity
      roundTripTypes.forEach((result, index) => {
        const original = types[index];
        expect(result.key).toBe(original.key);
        expect(Object.keys(result.properties)).toHaveLength(
          Object.keys(original.properties).length
        );
      });
    });

    it('should handle large field count efficiently', () => {
      // Create a type with many fields
      const properties: Record<string, any> = {};
      for (let i = 0; i < 100; i++) {
        properties[`field${i}`] = {
          type: i % 5 === 0 ? 'XhtmlString' : 'String',
          displayName: `Field ${i}`,
          required: i % 3 === 0
        };
      }

      const largeType: OptimizelyContentType = {
        key: 'LargeContentType',
        displayName: 'Large Content Type',
        description: 'Type with many fields',
        baseType: '_page',
        source: 'test',
        sortOrder: 1,
        mayContainTypes: [],
        properties
      };

      const startTime = performance.now();
      
      const universalType = provider.mapToUniversal(largeType);
      const roundTripType = provider.mapFromUniversal(universalType);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Transformed type with 100 fields in ${duration.toFixed(2)}ms`);
      
      // Should complete within 50ms even with many fields
      expect(duration).toBeLessThan(50);
      expect(universalType.fields).toHaveLength(100);
      expect(Object.keys(roundTripType.properties)).toHaveLength(100);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during repeated transformations', () => {
      const type = {
        key: 'TestType',
        displayName: 'Test Type',
        description: 'Test',
        baseType: '_page',
        source: 'test',
        sortOrder: 1,
        mayContainTypes: [],
        properties: {
          title: {
            type: 'String',
            displayName: 'Title',
            required: true
          }
        }
      };

      // Initial memory baseline
      if (global.gc) {
        global.gc();
      }
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many transformations
      for (let i = 0; i < 1000; i++) {
        const universal = provider.mapToUniversal(type);
        provider.mapFromUniversal(universal);
      }

      // Check memory after transformations
      if (global.gc) {
        global.gc();
      }
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`Memory increase after 1000 transformations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Comparison with Direct Integration', () => {
    it('should have comparable performance to direct mapping', () => {
      // Simulate direct mapping without provider abstraction
      const directMap = (type: OptimizelyContentType) => ({
        id: type.key,
        name: type.key,
        fields: Object.entries(type.properties).map(([key, prop]) => ({
          name: key,
          type: prop.type
        }))
      });

      const types: OptimizelyContentType[] = [];
      for (let i = 0; i < 100; i++) {
        types.push({
          key: `Type${i}`,
          displayName: `Type ${i}`,
          description: '',
          baseType: '_page',
          source: 'test',
          sortOrder: i,
          mayContainTypes: [],
          properties: {
            field1: { type: 'String', displayName: 'Field 1', required: true }
          }
        });
      }

      // Direct mapping performance
      const directStart = performance.now();
      types.map(directMap);
      const directTime = performance.now() - directStart;

      // Provider mapping performance
      const providerStart = performance.now();
      types.map(type => provider.mapToUniversal(type));
      const providerTime = performance.now() - providerStart;

      console.log(`Direct mapping: ${directTime.toFixed(2)}ms`);
      console.log(`Provider mapping: ${providerTime.toFixed(2)}ms`);
      console.log(`Overhead: ${((providerTime / directTime - 1) * 100).toFixed(1)}%`);

      // Provider should not be more than 3x slower than direct mapping
      expect(providerTime).toBeLessThan(directTime * 3);
    });
  });
});