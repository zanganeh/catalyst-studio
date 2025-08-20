/**
 * Type Detector - Auto-detect types from data
 * Suggests best universal type based on value analysis
 */

import { Primitive, PrimitiveType } from '../types/primitives';
import { CommonPatternType, CommonPattern } from '../types/common-patterns';

/**
 * Type detection result
 */
export interface TypeDetectionResult {
  suggestedType: Primitive | CommonPatternType;
  confidence: number;
  alternativeTypes: Array<{
    type: Primitive | CommonPatternType;
    confidence: number;
  }>;
  reasoning: string[];
}

/**
 * Type detector class
 */
export class TypeDetector {
  /**
   * Auto-detect type from data
   */
  static detectType(value: any, hints?: TypeDetectionHints): TypeDetectionResult {
    const candidates = this.generateCandidates(value, hints);
    const scored = this.scoreCandidates(value, candidates, hints);
    const sorted = scored.sort((a, b) => b.confidence - a.confidence);

    const best = sorted[0];
    const alternatives = sorted.slice(1, 4); // Top 3 alternatives

    return {
      suggestedType: best.type,
      confidence: best.confidence,
      alternativeTypes: alternatives,
      reasoning: best.reasoning
    };
  }

  /**
   * Suggest best universal type
   */
  static suggestType(
    value: any,
    platform?: string,
    constraints?: TypeConstraints
  ): Primitive | CommonPatternType {
    const hints: TypeDetectionHints = {
      platform,
      constraints
    };

    const result = this.detectType(value, hints);
    return result.suggestedType;
  }

  /**
   * Validate type assignment
   */
  static validateAssignment(
    value: any,
    type: Primitive | CommonPatternType
  ): {
    valid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check if value matches type
    if ('type' in type) {
      // Validate primitive
      const validationResult = this.validatePrimitive(value, type);
      if (!validationResult.valid) {
        issues.push(...validationResult.issues);
        suggestions.push(...validationResult.suggestions);
      }
    } else if ('pattern' in type) {
      // Validate pattern
      const validationResult = this.validatePattern(value, type);
      if (!validationResult.valid) {
        issues.push(...validationResult.issues);
        suggestions.push(...validationResult.suggestions);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Private helper methods
   */

  private static generateCandidates(
    value: any,
    hints?: TypeDetectionHints
  ): TypeCandidate[] {
    const candidates: TypeCandidate[] = [];

    // Check for null/undefined
    if (value === null || value === undefined) {
      return [{
        type: { type: PrimitiveType.TEXT, required: false },
        confidence: 100,
        reasoning: ['Value is null/undefined']
      }];
    }

    // Primitive type candidates
    if (typeof value === 'string') {
      candidates.push(...this.detectStringTypes(value));
    } else if (typeof value === 'number') {
      candidates.push(...this.detectNumberTypes(value));
    } else if (typeof value === 'boolean') {
      candidates.push({
        type: { type: PrimitiveType.BOOLEAN },
        confidence: 100,
        reasoning: ['Value is boolean']
      });
    } else if (value instanceof Date) {
      candidates.push({
        type: { type: PrimitiveType.DATE },
        confidence: 100,
        reasoning: ['Value is Date object']
      });
    } else if (Array.isArray(value)) {
      candidates.push(...this.detectArrayTypes(value));
    } else if (typeof value === 'object') {
      candidates.push(...this.detectObjectTypes(value));
    }

    // Apply hints if provided
    if (hints?.constraints) {
      candidates.forEach(candidate => {
        this.applyConstraints(candidate, hints.constraints!);
      });
    }

    return candidates;
  }

  private static detectStringTypes(value: string): TypeCandidate[] {
    const candidates: TypeCandidate[] = [];
    const length = value.length;

    // Check for specific patterns first
    if (this.isUrl(value)) {
      candidates.push({
        type: { type: PrimitiveType.TEXT, pattern: '^https?://' },
        confidence: 95,
        reasoning: ['Value matches URL pattern']
      });
    }

    if (this.isEmail(value)) {
      candidates.push({
        type: { type: PrimitiveType.TEXT, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
        confidence: 95,
        reasoning: ['Value matches email pattern']
      });
    }

    if (this.isSlug(value)) {
      candidates.push({
        type: { pattern: CommonPattern.SLUG },
        confidence: 90,
        reasoning: ['Value matches slug pattern']
      });
    }

    if (this.isHtml(value)) {
      candidates.push({
        type: { pattern: CommonPattern.RICH_TEXT, format: 'html' },
        confidence: 85,
        reasoning: ['Value contains HTML tags']
      });
    }

    if (this.isMarkdown(value)) {
      candidates.push({
        type: { pattern: CommonPattern.RICH_TEXT, format: 'markdown' },
        confidence: 80,
        reasoning: ['Value contains markdown formatting']
      });
    }

    if (this.isJson(value)) {
      candidates.push({
        type: { type: PrimitiveType.JSON },
        confidence: 90,
        reasoning: ['Value is valid JSON string']
      });
    }

    if (this.isIsoDate(value)) {
      candidates.push({
        type: { type: PrimitiveType.DATE },
        confidence: 95,
        reasoning: ['Value matches ISO date format']
      });
    }

    // Default string types based on length
    if (length <= 255) {
      candidates.push({
        type: { type: PrimitiveType.TEXT, maxLength: 255 },
        confidence: 70,
        reasoning: ['Short string (≤255 chars)']
      });
    } else {
      candidates.push({
        type: { type: PrimitiveType.LONG_TEXT },
        confidence: 75,
        reasoning: [`Long string (${length} chars)`]
      });
    }

    return candidates;
  }

  private static detectNumberTypes(value: number): TypeCandidate[] {
    const candidates: TypeCandidate[] = [];

    if (Number.isInteger(value)) {
      candidates.push({
        type: { type: PrimitiveType.NUMBER, isInteger: true },
        confidence: 100,
        reasoning: ['Value is integer']
      });
    } else {
      // Check decimal precision
      const decimalPlaces = value.toString().split('.')[1]?.length || 0;
      
      if (decimalPlaces > 2) {
        candidates.push({
          type: { type: PrimitiveType.DECIMAL, scale: decimalPlaces },
          confidence: 90,
          reasoning: [`High precision decimal (${decimalPlaces} places)`]
        });
      } else {
        candidates.push({
          type: { type: PrimitiveType.NUMBER },
          confidence: 95,
          reasoning: ['Floating point number']
        });
      }
    }

    return candidates;
  }

  private static detectArrayTypes(value: any[]): TypeCandidate[] {
    const candidates: TypeCandidate[] = [];

    if (value.length === 0) {
      candidates.push({
        type: { pattern: CommonPattern.COLLECTION, itemType: { type: PrimitiveType.JSON } },
        confidence: 50,
        reasoning: ['Empty array']
      });
      return candidates;
    }

    // Analyze array contents
    const itemTypes = new Set(value.map(item => typeof item));
    const isHomogeneous = itemTypes.size === 1;

    // Check for tags pattern
    if (isHomogeneous && itemTypes.has('string')) {
      const allShortStrings = value.every(item => item.length < 50);
      if (allShortStrings) {
        candidates.push({
          type: { pattern: CommonPattern.TAGS },
          confidence: 85,
          reasoning: ['Array of short strings suggests tags']
        });
      }
    }

    // Check for component pattern
    if (isHomogeneous && itemTypes.has('object')) {
      const hasTypeField = value.every(item => item && (item.type || item._type));
      if (hasTypeField) {
        candidates.push({
          type: { pattern: CommonPattern.REPEATER, fields: [] },
          confidence: 80,
          reasoning: ['Array of typed objects suggests repeater']
        });
      }
    }

    // Check for media collection
    if (this.isMediaArray(value)) {
      candidates.push({
        type: { pattern: CommonPattern.MEDIA, multiple: true },
        confidence: 85,
        reasoning: ['Array contains media-like objects']
      });
    }

    // Default collection
    candidates.push({
      type: { 
        pattern: CommonPattern.COLLECTION,
        itemType: this.detectCommonItemType(value)
      },
      confidence: 70,
      reasoning: ['Generic collection']
    });

    return candidates;
  }

  private static detectObjectTypes(value: object): TypeCandidate[] {
    const candidates: TypeCandidate[] = [];

    // Check for media object
    if (this.isMediaObject(value)) {
      candidates.push({
        type: { pattern: CommonPattern.MEDIA },
        confidence: 90,
        reasoning: ['Object has media properties (url, alt, etc.)']
      });
    }

    // Check for component
    if (this.isComponentObject(value)) {
      candidates.push({
        type: { pattern: CommonPattern.COMPONENT },
        confidence: 85,
        reasoning: ['Object has component structure']
      });
    }

    // Check for rich text object
    if (this.isRichTextObject(value)) {
      candidates.push({
        type: { pattern: CommonPattern.RICH_TEXT },
        confidence: 85,
        reasoning: ['Object has rich text structure']
      });
    }

    // Default to JSON
    candidates.push({
      type: { type: PrimitiveType.JSON },
      confidence: 60,
      reasoning: ['Generic object structure']
    });

    return candidates;
  }

  private static scoreCandidates(
    value: any,
    candidates: TypeCandidate[],
    hints?: TypeDetectionHints
  ): TypeCandidate[] {
    return candidates.map(candidate => {
      let score = candidate.confidence;

      // Apply platform-specific scoring
      if (hints?.platform) {
        score = this.adjustForPlatform(score, candidate.type, hints.platform);
      }

      // Apply constraint scoring
      if (hints?.constraints) {
        score = this.adjustForConstraints(score, candidate.type, hints.constraints);
      }

      return {
        ...candidate,
        confidence: Math.min(100, Math.max(0, score))
      };
    });
  }

  private static applyConstraints(
    candidate: TypeCandidate,
    constraints: TypeConstraints
  ): void {
    const type = candidate.type;

    if ('type' in type) {
      // Apply primitive constraints
      if (constraints.required !== undefined) {
        type.required = constraints.required;
      }
      if (constraints.defaultValue !== undefined) {
        type.defaultValue = constraints.defaultValue;
      }
    } else if ('pattern' in type) {
      // Apply pattern constraints
      if (constraints.required !== undefined) {
        type.required = constraints.required;
      }
    }
  }

  private static adjustForPlatform(
    score: number,
    type: Primitive | CommonPatternType,
    platform: string
  ): number {
    // Platform-specific adjustments
    if (platform === 'optimizely' && 'pattern' in type) {
      if (type.pattern === CommonPattern.COMPONENT) {
        return score + 10; // Optimizely has excellent block support
      }
    }

    if (platform === 'contentful' && 'pattern' in type) {
      if (type.pattern === CommonPattern.RICH_TEXT) {
        return score + 5; // Contentful has good rich text support
      }
    }

    return score;
  }

  private static adjustForConstraints(
    score: number,
    type: Primitive | CommonPatternType,
    constraints: TypeConstraints
  ): number {
    // Constraint-based adjustments
    if (constraints.maxLength && 'type' in type) {
      if (type.type === PrimitiveType.TEXT && constraints.maxLength <= 255) {
        return score + 5;
      }
    }

    return score;
  }

  // Validation helpers
  private static validatePrimitive(
    value: any,
    type: Primitive
  ): { valid: boolean; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    switch (type.type) {
      case PrimitiveType.TEXT:
        if (typeof value !== 'string') {
          issues.push('Value is not a string');
          suggestions.push('Convert to string or use different type');
        }
        break;
      case PrimitiveType.NUMBER:
        if (typeof value !== 'number') {
          issues.push('Value is not a number');
          suggestions.push('Parse as number or use string type');
        }
        break;
      case PrimitiveType.BOOLEAN:
        if (typeof value !== 'boolean') {
          issues.push('Value is not a boolean');
          suggestions.push('Convert to boolean or use different type');
        }
        break;
      // Add more validations as needed
    }

    return { valid: issues.length === 0, issues, suggestions };
  }

  private static validatePattern(
    value: any,
    type: CommonPatternType
  ): { valid: boolean; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    switch (type.pattern) {
      case CommonPattern.COLLECTION:
        if (!Array.isArray(value)) {
          issues.push('Value is not an array');
          suggestions.push('Wrap in array or use different pattern');
        }
        break;
      case CommonPattern.MEDIA:
        if (!this.isMediaObject(value) && typeof value !== 'string') {
          issues.push('Value is not a valid media object or URL');
          suggestions.push('Provide URL or media object structure');
        }
        break;
      // Add more validations as needed
    }

    return { valid: issues.length === 0, issues, suggestions };
  }

  // Pattern detection helpers
  private static isUrl(value: string): boolean {
    return /^https?:\/\/[^\s]+/.test(value);
  }

  private static isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private static isSlug(value: string): boolean {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  }

  private static isHtml(value: string): boolean {
    return /<[^>]+>/.test(value);
  }

  private static isMarkdown(value: string): boolean {
    return /[#*`\[\]()]/.test(value);
  }

  private static isJson(value: string): boolean {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  private static isIsoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(value);
  }

  private static isMediaObject(value: any): boolean {
    if (!value || typeof value !== 'object') return false;
    return !!(value.url || value.src || value.path || value.asset);
  }

  private static isComponentObject(value: any): boolean {
    if (!value || typeof value !== 'object') return false;
    return !!(value.type || value._type || value.componentType);
  }

  private static isRichTextObject(value: any): boolean {
    if (!value || typeof value !== 'object') return false;
    return !!(value.blocks || value.content || value.document || value.html);
  }

  private static isMediaArray(value: any[]): boolean {
    if (value.length === 0) return false;
    return value.every(item => this.isMediaObject(item) || typeof item === 'string');
  }

  private static detectCommonItemType(array: any[]): Primitive {
    if (array.length === 0) {
      return { type: PrimitiveType.JSON };
    }

    const firstItem = array[0];
    const detected = this.detectType(firstItem);
    
    if ('type' in detected.suggestedType) {
      return detected.suggestedType;
    }
    
    return { type: PrimitiveType.JSON };
  }
}

/**
 * Type detection hints
 */
export interface TypeDetectionHints {
  platform?: string;
  constraints?: TypeConstraints;
  context?: string;
}

/**
 * Type constraints
 */
export interface TypeConstraints {
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  defaultValue?: any;
}

/**
 * Type candidate
 */
interface TypeCandidate {
  type: Primitive | CommonPatternType;
  confidence: number;
  reasoning: string[];
}