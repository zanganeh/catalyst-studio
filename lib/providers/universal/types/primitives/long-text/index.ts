/**
 * LongText Primitive Type - Long text content without length restrictions
 */

import { PrimitiveType, PrimitiveConfig, ValidationResult, TransformResult } from '../base/primitive-type';

/**
 * LongText primitive configuration
 */
export interface LongTextConfig extends PrimitiveConfig {
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  trim?: boolean;
  stripHtml?: boolean;
  maxWords?: number;
}

/**
 * LongText primitive implementation
 */
export class LongTextPrimitive extends PrimitiveType<string, LongTextConfig> {
  get typeId(): string {
    return 'longText';
  }

  get typeName(): string {
    return 'Long Text';
  }

  validate(value: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Type check
    if (typeof value !== 'string') {
      return {
        valid: false,
        errors: ['Value must be a string']
      };
    }

    const length = value.length;
    const minLength = this.config.minLength ?? 0;
    const maxLength = this.config.maxLength;

    // Length validation
    if (length < minLength) {
      errors.push(`Text must be at least ${minLength} characters`);
    }

    if (maxLength !== undefined && length > maxLength) {
      errors.push(`Text cannot exceed ${maxLength} characters`);
    }

    // Word count validation
    if (this.config.maxWords !== undefined) {
      const wordCount = this.countWords(value);
      if (wordCount > this.config.maxWords) {
        errors.push(`Text cannot exceed ${this.config.maxWords} words (has ${wordCount})`);
      }
    }

    // Warnings for edge cases
    if (length > 50000) {
      warnings.push('Very long text (>50,000 characters) may have performance impacts');
    }

    if (length < 256) {
      warnings.push('Consider using Text primitive for content under 256 characters');
    }

    // Check for potential issues
    if (value.includes('<script>') || value.includes('javascript:')) {
      warnings.push('Content contains potential script tags');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  transform(value: any): TransformResult {
    const warnings: string[] = [];
    let transformed: string;

    // Convert to string
    if (typeof value === 'string') {
      transformed = value;
    } else if (value === null || value === undefined) {
      transformed = '';
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      transformed = String(value);
      warnings.push(`Converted ${typeof value} to string`);
    } else if (typeof value === 'object') {
      // Check if it's an array
      if (Array.isArray(value)) {
        transformed = value.join('\n');
        warnings.push('Converted array to multi-line string');
      } else {
        transformed = JSON.stringify(value, null, 2);
        warnings.push('Converted object to formatted JSON string');
      }
    } else {
      return {
        success: false,
        value: '',
        warnings: ['Cannot convert value to string']
      };
    }

    // Apply transformations
    if (this.config.trim) {
      const originalLength = transformed.length;
      transformed = transformed.trim();
      if (originalLength !== transformed.length) {
        warnings.push('Trimmed whitespace from text');
      }
    }

    if (this.config.stripHtml) {
      const originalLength = transformed.length;
      transformed = this.stripHtmlTags(transformed);
      if (originalLength !== transformed.length) {
        warnings.push('Stripped HTML tags from text');
      }
    }

    // Truncate if too long
    if (this.config.maxLength !== undefined && transformed.length > this.config.maxLength) {
      transformed = this.truncateText(transformed, this.config.maxLength);
      warnings.push(`Truncated to ${this.config.maxLength} characters`);
    }

    // Truncate by words
    if (this.config.maxWords !== undefined) {
      const wordCount = this.countWords(transformed);
      if (wordCount > this.config.maxWords) {
        transformed = this.truncateByWords(transformed, this.config.maxWords);
        warnings.push(`Truncated to ${this.config.maxWords} words`);
      }
    }

    return {
      success: true,
      value: transformed,
      warnings
    };
  }

  getDefaultValue(): string {
    if (this.config.defaultValue !== undefined) {
      return this.config.defaultValue;
    }
    return '';
  }

  serialize(): object {
    return this.config;
  }

  clone(config?: Partial<LongTextConfig>): LongTextPrimitive {
    return new LongTextPrimitive({
      ...this.config,
      ...config
    });
  }

  protected getDefaultConfig(): Partial<LongTextConfig> {
    return {
      minLength: 0,
      trim: true,
      stripHtml: false
    };
  }

  protected validateConfig(): void {
    if (this.config.minLength !== undefined && this.config.minLength < 0) {
      throw new Error('minLength cannot be negative');
    }

    if (this.config.maxLength !== undefined && this.config.maxLength < 1) {
      throw new Error('maxLength must be at least 1');
    }

    if (this.config.minLength !== undefined && 
        this.config.maxLength !== undefined && 
        this.config.minLength > this.config.maxLength) {
      throw new Error('minLength cannot be greater than maxLength');
    }

    if (this.config.maxWords !== undefined && this.config.maxWords < 1) {
      throw new Error('maxWords must be at least 1');
    }
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    const words = text.trim().split(/\s+/);
    return words.filter(word => word.length > 0).length;
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtmlTags(text: string): string {
    // Basic HTML tag stripping (not foolproof)
    return text.replace(/<[^>]*>/g, '');
  }

  /**
   * Truncate text intelligently
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    // Try to truncate at a word boundary
    let truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) {
      // If we found a space reasonably close to the end
      truncated = truncated.substring(0, lastSpace);
    }

    return truncated + '...';
  }

  /**
   * Truncate text by word count
   */
  private truncateByWords(text: string, maxWords: number): string {
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) {
      return text;
    }

    return words.slice(0, maxWords).join(' ') + '...';
  }

  /**
   * Get text statistics
   */
  getStatistics(text: string): {
    characters: number;
    words: number;
    lines: number;
    paragraphs: number;
  } {
    return {
      characters: text.length,
      words: this.countWords(text),
      lines: text.split('\n').length,
      paragraphs: text.split(/\n\n+/).filter(p => p.trim().length > 0).length
    };
  }

  /**
   * Get excerpt from text
   */
  getExcerpt(text: string, maxLength: number = 200): string {
    if (text.length <= maxLength) {
      return text;
    }

    return this.truncateText(text, maxLength);
  }

  /**
   * Check if text contains pattern
   */
  contains(text: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      return text.includes(pattern);
    }
    return pattern.test(text);
  }
}

/**
 * Factory function for creating long text primitives
 */
export function createLongTextPrimitive(config?: LongTextConfig): LongTextPrimitive {
  return new LongTextPrimitive(config);
}