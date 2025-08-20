/**
 * Rich Text Fallback Handler
 * Handles conversion of rich text to fallback formats
 */

import { PrimitiveType, LongTextPrimitive } from '../../types/primitives';
import { RichTextPattern } from '../../types/common-patterns';

/**
 * Rich text fallback result
 */
export interface RichTextFallbackResult {
  content: string;
  format: 'markdown' | 'html' | 'plaintext';
  metadata: {
    originalFormat: string;
    dataLoss: string[];
    preservedFeatures: string[];
    lostFeatures: string[];
  };
  confidence: number;
}

/**
 * Rich text fallback handler
 */
export class RichTextFallbackHandler {
  /**
   * Convert rich text to markdown
   */
  static toMarkdown(value: any, pattern: RichTextPattern): RichTextFallbackResult {
    let content = '';
    let originalFormat = pattern.format || 'unknown';
    const dataLoss: string[] = [];
    const preservedFeatures: string[] = [];
    const lostFeatures: string[] = [];

    // Handle different rich text formats
    if (typeof value === 'string') {
      if (pattern.format === 'html') {
        content = this.htmlToMarkdown(value);
        preservedFeatures.push('basic formatting', 'links', 'headings');
        lostFeatures.push('custom styles', 'complex tables');
      } else if (pattern.format === 'markdown') {
        content = value;
        preservedFeatures.push('all markdown features');
      } else {
        content = value;
        dataLoss.push('Unknown format treated as plain text');
      }
    } else if (typeof value === 'object') {
      // Handle structured rich text (Slate, Portable Text, etc.)
      content = this.structuredToMarkdown(value, pattern.format);
      preservedFeatures.push('text content', 'basic structure');
      lostFeatures.push('custom blocks', 'interactive elements');
    }

    // Apply max length if specified
    if (pattern.maxLength && content.length > pattern.maxLength) {
      content = content.substring(0, pattern.maxLength);
      dataLoss.push(`Content truncated to ${pattern.maxLength} characters`);
    }

    return {
      content,
      format: 'markdown',
      metadata: {
        originalFormat,
        dataLoss,
        preservedFeatures,
        lostFeatures
      },
      confidence: this.calculateConfidence(pattern.format, 'markdown')
    };
  }

  /**
   * Convert rich text to plain text
   */
  static toPlainText(value: any, pattern: RichTextPattern): RichTextFallbackResult {
    let content = '';
    const dataLoss: string[] = [];
    const preservedFeatures: string[] = ['text content'];
    const lostFeatures: string[] = ['all formatting', 'links', 'structure'];

    if (typeof value === 'string') {
      if (pattern.format === 'html') {
        content = this.stripHtml(value);
      } else if (pattern.format === 'markdown') {
        content = this.stripMarkdown(value);
      } else {
        content = value;
      }
    } else if (typeof value === 'object') {
      content = this.extractText(value);
    }

    // Apply max length if specified
    if (pattern.maxLength && content.length > pattern.maxLength) {
      content = content.substring(0, pattern.maxLength);
      dataLoss.push(`Content truncated to ${pattern.maxLength} characters`);
    }

    return {
      content,
      format: 'plaintext',
      metadata: {
        originalFormat: pattern.format || 'unknown',
        dataLoss: [...dataLoss, 'All formatting removed'],
        preservedFeatures,
        lostFeatures
      },
      confidence: 50 // Low confidence due to significant data loss
    };
  }

  /**
   * Preserve formatting metadata
   */
  static preserveWithMetadata(value: any, pattern: RichTextPattern): any {
    const result = {
      _type: 'preserved_rich_text',
      _format: pattern.format,
      _content: value,
      _metadata: {
        allowedFormats: pattern.allowedFormats,
        allowedBlocks: pattern.allowedBlocks,
        allowedMarks: pattern.allowedMarks,
        maxLength: pattern.maxLength
      },
      _fallback: {
        markdown: '',
        plaintext: ''
      }
    };

    // Generate fallbacks
    const markdownResult = this.toMarkdown(value, pattern);
    const plaintextResult = this.toPlainText(value, pattern);
    
    result._fallback.markdown = markdownResult.content;
    result._fallback.plaintext = plaintextResult.content;

    return result;
  }

  /**
   * Private conversion methods
   */

  private static htmlToMarkdown(html: string): string {
    // Simple HTML to Markdown conversion
    let markdown = html;

    // Convert headings
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n');
    markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n');
    markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n');

    // Convert formatting
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

    // Convert links
    markdown = markdown.replace(/<a[^>]+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Convert lists
    markdown = markdown.replace(/<ul[^>]*>/gi, '\n');
    markdown = markdown.replace(/<\/ul>/gi, '\n');
    markdown = markdown.replace(/<ol[^>]*>/gi, '\n');
    markdown = markdown.replace(/<\/ol>/gi, '\n');
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

    // Convert paragraphs and breaks
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    markdown = markdown.replace(/<br[^>]*>/gi, '\n');

    // Convert blockquotes
    markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n');

    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]+>/g, '');

    // Clean up extra whitespace
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    markdown = markdown.trim();

    return markdown;
  }

  private static structuredToMarkdown(value: any, format?: string): string {
    if (format === 'slate' || format === 'portable-text') {
      return this.blockContentToMarkdown(value);
    }

    // Generic structured content
    if (Array.isArray(value)) {
      return value.map(block => this.blockToMarkdown(block)).join('\n\n');
    }

    if (value.content) {
      return this.structuredToMarkdown(value.content, format);
    }

    return JSON.stringify(value, null, 2);
  }

  private static blockContentToMarkdown(blocks: any[]): string {
    if (!Array.isArray(blocks)) return '';

    return blocks.map(block => {
      if (block._type === 'block' || block.type === 'paragraph') {
        return this.blockToMarkdown(block);
      }
      if (block.type === 'heading') {
        const level = block.level || 1;
        const prefix = '#'.repeat(level);
        return `${prefix} ${this.getBlockText(block)}`;
      }
      if (block.type === 'list') {
        return this.listToMarkdown(block);
      }
      if (block.type === 'blockquote') {
        return `> ${this.getBlockText(block)}`;
      }
      if (block.type === 'code') {
        return `\`\`\`${block.language || ''}\n${block.code || block.text}\n\`\`\``;
      }
      return this.getBlockText(block);
    }).join('\n\n');
  }

  private static blockToMarkdown(block: any): string {
    if (typeof block === 'string') return block;
    
    if (block.children || block.spans) {
      const children = block.children || block.spans || [];
      return children.map((child: any) => {
        const text = child.text || child.value || '';
        const marks = child.marks || [];
        
        let formatted = text;
        marks.forEach((mark: string) => {
          if (mark === 'strong' || mark === 'bold') {
            formatted = `**${formatted}**`;
          } else if (mark === 'em' || mark === 'italic') {
            formatted = `*${formatted}*`;
          } else if (mark === 'code') {
            formatted = `\`${formatted}\``;
          }
        });
        
        return formatted;
      }).join('');
    }

    return block.text || block.value || '';
  }

  private static listToMarkdown(list: any): string {
    const items = list.items || list.children || [];
    const isOrdered = list.ordered || list.type === 'ordered';
    
    return items.map((item: any, index: number) => {
      const prefix = isOrdered ? `${index + 1}.` : '-';
      const text = this.getBlockText(item);
      return `${prefix} ${text}`;
    }).join('\n');
  }

  private static getBlockText(block: any): string {
    if (typeof block === 'string') return block;
    if (block.text) return block.text;
    if (block.value) return block.value;
    if (block.children) {
      return block.children.map((c: any) => this.getBlockText(c)).join('');
    }
    return '';
  }

  private static stripHtml(html: string): string {
    // Remove HTML tags and decode entities
    let text = html.replace(/<[^>]+>/g, ' ');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/\s+/g, ' ');
    return text.trim();
  }

  private static stripMarkdown(markdown: string): string {
    // Remove markdown formatting
    let text = markdown;
    
    // Remove headers
    text = text.replace(/^#{1,6}\s+/gm, '');
    
    // Remove emphasis
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    text = text.replace(/\*([^*]+)\*/g, '$1');
    text = text.replace(/__([^_]+)__/g, '$1');
    text = text.replace(/_([^_]+)_/g, '$1');
    
    // Remove code
    text = text.replace(/`([^`]+)`/g, '$1');
    text = text.replace(/```[^`]*```/g, '');
    
    // Remove links
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    
    // Remove lists
    text = text.replace(/^[\s]*[-*+]\s+/gm, '');
    text = text.replace(/^[\s]*\d+\.\s+/gm, '');
    
    // Remove blockquotes
    text = text.replace(/^>\s+/gm, '');
    
    // Clean up
    text = text.replace(/\n{2,}/g, '\n');
    return text.trim();
  }

  private static extractText(obj: any): string {
    if (typeof obj === 'string') return obj;
    if (!obj) return '';
    
    let text = '';
    
    if (Array.isArray(obj)) {
      text = obj.map(item => this.extractText(item)).join(' ');
    } else if (typeof obj === 'object') {
      if (obj.text) text = obj.text;
      else if (obj.value) text = obj.value;
      else if (obj.content) text = this.extractText(obj.content);
      else if (obj.children) text = this.extractText(obj.children);
      else {
        // Extract text from all string properties
        Object.values(obj).forEach(val => {
          if (typeof val === 'string') {
            text += ' ' + val;
          } else if (typeof val === 'object') {
            text += ' ' + this.extractText(val);
          }
        });
      }
    }
    
    return text.trim();
  }

  private static calculateConfidence(sourceFormat?: string, targetFormat?: string): number {
    if (sourceFormat === targetFormat) return 100;
    
    const confidenceMatrix: Record<string, Record<string, number>> = {
      markdown: {
        html: 90,
        plaintext: 60,
        slate: 75,
        'portable-text': 70
      },
      html: {
        markdown: 85,
        plaintext: 55,
        slate: 70,
        'portable-text': 65
      },
      slate: {
        markdown: 80,
        html: 85,
        plaintext: 50,
        'portable-text': 75
      },
      'portable-text': {
        markdown: 75,
        html: 80,
        plaintext: 50,
        slate: 75
      }
    };

    if (sourceFormat && targetFormat && confidenceMatrix[sourceFormat]) {
      return confidenceMatrix[sourceFormat][targetFormat] || 60;
    }

    return 60;
  }
}