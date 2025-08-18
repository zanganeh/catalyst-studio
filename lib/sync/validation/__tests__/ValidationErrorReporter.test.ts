import { ValidationErrorReporter } from '../ValidationErrorReporter';
import { ValidationResult, ValidationError } from '../ContentTypeValidator';

describe('ValidationErrorReporter', () => {
  let reporter: ValidationErrorReporter;

  beforeEach(() => {
    reporter = new ValidationErrorReporter();
  });

  describe('generateReport', () => {
    it('should generate report for valid result', () => {
      const validResult: ValidationResult = {
        valid: true,
        errors: [],
      };

      const report = reporter.generateReport(validResult);
      
      expect(report.summary).toContain('✅');
      expect(report.summary).toContain('successful');
      expect(report.totalErrors).toBe(0);
      expect(report.totalWarnings).toBe(0);
      expect(report.totalInfo).toBe(0);
      expect(report.errors).toHaveLength(0);
    });

    it('should generate report with errors', () => {
      const errors: ValidationError[] = [
        {
          type: 'INVALID_STRUCTURE',
          field: 'fields[0].type',
          message: 'Invalid field type',
          severity: 'error',
        },
        {
          type: 'BUSINESS_RULE_VIOLATION',
          field: 'name',
          message: 'Name cannot start with underscore',
          severity: 'error',
        },
      ];

      const invalidResult: ValidationResult = {
        valid: false,
        errors,
      };

      const report = reporter.generateReport(invalidResult);
      
      expect(report.summary).toContain('❌');
      expect(report.summary).toContain('failed');
      expect(report.totalErrors).toBe(2);
      expect(report.totalWarnings).toBe(0);
      expect(report.errors).toHaveLength(2);
    });

    it('should count errors, warnings, and info separately', () => {
      const mixedErrors: ValidationError[] = [
        {
          type: 'ERROR_TYPE',
          field: 'field1',
          message: 'Error message',
          severity: 'error',
        },
        {
          type: 'WARNING_TYPE',
          field: 'field2',
          message: 'Warning message',
          severity: 'warning',
        },
        {
          type: 'WARNING_TYPE',
          field: 'field3',
          message: 'Another warning',
          severity: 'warning',
        },
        {
          type: 'INFO_TYPE',
          field: 'field4',
          message: 'Info message',
          severity: 'info',
        },
      ];

      const result: ValidationResult = {
        valid: false,
        errors: mixedErrors,
      };

      const report = reporter.generateReport(result);
      
      expect(report.totalErrors).toBe(1);
      expect(report.totalWarnings).toBe(2);
      expect(report.totalInfo).toBe(1);
      expect(report.summary).toContain('1 error');
      expect(report.summary).toContain('2 warnings');
      expect(report.summary).toContain('1 info');
    });

    it('should group errors by type', () => {
      const errors: ValidationError[] = [
        {
          type: 'TYPE_A',
          field: 'field1',
          message: 'Message 1',
          severity: 'error',
        },
        {
          type: 'TYPE_A',
          field: 'field2',
          message: 'Message 2',
          severity: 'error',
        },
        {
          type: 'TYPE_B',
          field: 'field3',
          message: 'Message 3',
          severity: 'warning',
        },
      ];

      const result: ValidationResult = {
        valid: false,
        errors,
      };

      const report = reporter.generateReport(result);
      
      expect(Object.keys(report.groupedErrors)).toHaveLength(2);
      expect(report.groupedErrors['TYPE_A']).toHaveLength(2);
      expect(report.groupedErrors['TYPE_B']).toHaveLength(1);
    });

    it('should generate JSON output', () => {
      const errors: ValidationError[] = [
        {
          type: 'TEST_TYPE',
          field: 'test_field',
          message: 'Test message',
          severity: 'error',
        },
      ];

      const result: ValidationResult = {
        valid: false,
        errors,
      };

      const report = reporter.generateReport(result);
      const parsed = JSON.parse(report.jsonOutput);
      
      expect(parsed.valid).toBe(false);
      expect(parsed.errors).toHaveLength(1);
      expect(parsed.errors[0].type).toBe('TEST_TYPE');
    });
  });

  describe('formatError', () => {
    it('should format error with icon and details', () => {
      const error: ValidationError = {
        type: 'TEST_ERROR',
        field: 'test.field',
        message: 'This is a test error',
        severity: 'error',
      };

      const formatted = reporter.formatError(error);
      
      expect(formatted).toContain('❌');
      expect(formatted).toContain('[ERROR]');
      expect(formatted).toContain('TEST_ERROR');
      expect(formatted).toContain('test.field');
      expect(formatted).toContain('This is a test error');
    });

    it('should format warning with appropriate icon', () => {
      const warning: ValidationError = {
        type: 'TEST_WARNING',
        field: 'warning.field',
        message: 'This is a warning',
        severity: 'warning',
      };

      const formatted = reporter.formatError(warning);
      
      expect(formatted).toContain('⚠️');
      expect(formatted).toContain('[WARNING]');
    });

    it('should format info with appropriate icon', () => {
      const info: ValidationError = {
        type: 'TEST_INFO',
        field: 'info.field',
        message: 'This is info',
        severity: 'info',
      };

      const formatted = reporter.formatError(info);
      
      expect(formatted).toContain('ℹ️');
      expect(formatted).toContain('[INFO]');
    });

    it('should handle errors without field', () => {
      const error: ValidationError = {
        type: 'GENERAL_ERROR',
        field: '',
        message: 'General error message',
        severity: 'error',
      };

      const formatted = reporter.formatError(error);
      
      expect(formatted).not.toContain(' at ""');
      expect(formatted).toContain('GENERAL_ERROR');
      expect(formatted).toContain('General error message');
    });
  });

  describe('formatDetailedReport', () => {
    it('should format a detailed text report', () => {
      const errors: ValidationError[] = [
        {
          type: 'INVALID_STRUCTURE',
          field: 'fields[0].type',
          message: 'Invalid field type',
          severity: 'error',
        },
        {
          type: 'BUSINESS_RULE_VIOLATION',
          field: 'name',
          message: 'Name cannot start with underscore',
          severity: 'error',
        },
        {
          type: 'PLATFORM_INCOMPATIBLE',
          field: 'fields[1].validation.regex',
          message: 'Regex validation not supported',
          severity: 'warning',
        },
      ];

      const result: ValidationResult = {
        valid: false,
        errors,
      };

      const detailed = reporter.formatDetailedReport(result);
      
      expect(detailed).toContain('❌ Validation failed');
      expect(detailed).toContain('INVALID_STRUCTURE');
      expect(detailed).toContain('BUSINESS_RULE_VIOLATION');
      expect(detailed).toContain('PLATFORM_INCOMPATIBLE');
      expect(detailed).toContain('Statistics');
      expect(detailed).toContain('Total Errors: 2');
      expect(detailed).toContain('Total Warnings: 1');
    });

    it('should format successful validation report', () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
      };

      const detailed = reporter.formatDetailedReport(result);
      
      expect(detailed).toContain('✅ Validation successful');
      expect(detailed).not.toContain('Statistics');
    });
  });

  describe('generateHtmlReport', () => {
    it('should generate HTML report for valid result', () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
      };

      const html = reporter.generateHtmlReport(result);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('class="summary success"');
      expect(html).toContain('✅ Validation successful');
      expect(html).not.toContain('class="errors-container"');
    });

    it('should generate HTML report with errors', () => {
      const errors: ValidationError[] = [
        {
          type: 'TEST_ERROR',
          field: 'test.field',
          message: 'Test error message',
          severity: 'error',
        },
        {
          type: 'TEST_WARNING',
          field: 'warning.field',
          message: 'Test warning message',
          severity: 'warning',
        },
      ];

      const result: ValidationResult = {
        valid: false,
        errors,
      };

      const html = reporter.generateHtmlReport(result);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('class="summary failure"');
      expect(html).toContain('❌ Validation failed');
      expect(html).toContain('class="errors-container"');
      expect(html).toContain('TEST_ERROR');
      expect(html).toContain('test.field');
      expect(html).toContain('Test error message');
      expect(html).toContain('class="stat error"');
      expect(html).toContain('class="stat warning"');
      expect(html).toContain('Errors: 1');
      expect(html).toContain('Warnings: 1');
    });

    it('should group errors by type in HTML', () => {
      const errors: ValidationError[] = [
        {
          type: 'TYPE_A',
          field: 'field1',
          message: 'Message 1',
          severity: 'error',
        },
        {
          type: 'TYPE_A',
          field: 'field2',
          message: 'Message 2',
          severity: 'error',
        },
        {
          type: 'TYPE_B',
          field: 'field3',
          message: 'Message 3',
          severity: 'warning',
        },
      ];

      const result: ValidationResult = {
        valid: false,
        errors,
      };

      const html = reporter.generateHtmlReport(result);
      
      expect(html).toContain('TYPE_A');
      expect(html).toContain('TYPE_B');
      expect(html).toContain('field1');
      expect(html).toContain('field2');
      expect(html).toContain('field3');
    });
  });
});