import { ValidationError, ValidationResult, ValidationSeverity } from './ContentTypeValidator';

export interface ValidationReport {
  summary: string;
  totalErrors: number;
  totalWarnings: number;
  totalInfo: number;
  errors: ValidationError[];
  groupedErrors: Record<string, ValidationError[]>;
  jsonOutput: string;
}

export class ValidationErrorReporter {
  public generateReport(validationResult: ValidationResult): ValidationReport {
    const errors = validationResult.errors || [];
    
    const errorCount = errors.filter(e => e.severity === 'error').length;
    const warningCount = errors.filter(e => e.severity === 'warning').length;
    const infoCount = errors.filter(e => e.severity === 'info').length;

    const summary = this.generateSummary(validationResult.valid, errorCount, warningCount, infoCount);
    const groupedErrors = this.groupErrorsByType(errors);

    return {
      summary,
      totalErrors: errorCount,
      totalWarnings: warningCount,
      totalInfo: infoCount,
      errors,
      groupedErrors,
      jsonOutput: this.generateJsonOutput(validationResult),
    };
  }

  private generateSummary(valid: boolean, errors: number, warnings: number, info: number): string {
    if (valid) {
      return '✅ Validation successful. No errors found.';
    }

    const parts: string[] = ['❌ Validation failed.'];
    
    if (errors > 0) {
      parts.push(`${errors} error${errors !== 1 ? 's' : ''}`);
    }
    
    if (warnings > 0) {
      parts.push(`${warnings} warning${warnings !== 1 ? 's' : ''}`);
    }
    
    if (info > 0) {
      parts.push(`${info} info message${info !== 1 ? 's' : ''}`);
    }

    return parts.join(' ');
  }

  private groupErrorsByType(errors: ValidationError[]): Record<string, ValidationError[]> {
    const grouped: Record<string, ValidationError[]> = {};

    errors.forEach(error => {
      if (!grouped[error.type]) {
        grouped[error.type] = [];
      }
      grouped[error.type].push(error);
    });

    return grouped;
  }

  private generateJsonOutput(validationResult: ValidationResult): string {
    return JSON.stringify(validationResult, null, 2);
  }

  public formatError(error: ValidationError): string {
    const severityIcons: Record<ValidationSeverity, string> = {
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };

    const icon = severityIcons[error.severity] || '';
    const field = error.field ? ` at "${error.field}"` : '';
    
    return `${icon} [${error.severity.toUpperCase()}] ${error.type}${field}: ${error.message}`;
  }

  public formatDetailedReport(validationResult: ValidationResult): string {
    const report = this.generateReport(validationResult);
    const lines: string[] = [];

    // Add summary
    lines.push(report.summary);
    lines.push('');

    if (!validationResult.valid) {
      // Group errors by type
      Object.entries(report.groupedErrors).forEach(([type, errors]) => {
        lines.push(`\n${type}:`);
        lines.push('-'.repeat(50));
        
        errors.forEach(error => {
          lines.push(this.formatError(error));
        });
      });

      // Add statistics
      lines.push('');
      lines.push('Statistics:');
      lines.push('-'.repeat(50));
      lines.push(`Total Errors: ${report.totalErrors}`);
      lines.push(`Total Warnings: ${report.totalWarnings}`);
      lines.push(`Total Info: ${report.totalInfo}`);
    }

    return lines.join('\n');
  }

  public generateHtmlReport(validationResult: ValidationResult): string {
    const report = this.generateReport(validationResult);
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Validation Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .summary {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .summary.success {
            color: #28a745;
        }
        
        .summary.failure {
            color: #dc3545;
        }
        
        .statistics {
            display: flex;
            gap: 20px;
            margin-top: 15px;
        }
        
        .stat {
            padding: 10px 15px;
            border-radius: 4px;
            background: #f8f9fa;
        }
        
        .stat.error {
            background: #f8d7da;
            color: #721c24;
        }
        
        .stat.warning {
            background: #fff3cd;
            color: #856404;
        }
        
        .stat.info {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .errors-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .error-group {
            margin-bottom: 20px;
        }
        
        .error-group-title {
            font-weight: bold;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        
        .error-item {
            padding: 10px;
            margin-bottom: 8px;
            border-left: 4px solid;
            background: #f8f9fa;
            border-radius: 4px;
        }
        
        .error-item.error {
            border-left-color: #dc3545;
            background: #f8d7da;
        }
        
        .error-item.warning {
            border-left-color: #ffc107;
            background: #fff3cd;
        }
        
        .error-item.info {
            border-left-color: #17a2b8;
            background: #d1ecf1;
        }
        
        .field {
            font-family: 'Courier New', monospace;
            font-weight: bold;
            color: #495057;
        }
        
        .message {
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="summary ${validationResult.valid ? 'success' : 'failure'}">
            ${report.summary}
        </div>
        <div class="statistics">
            ${report.totalErrors > 0 ? `<div class="stat error">Errors: ${report.totalErrors}</div>` : ''}
            ${report.totalWarnings > 0 ? `<div class="stat warning">Warnings: ${report.totalWarnings}</div>` : ''}
            ${report.totalInfo > 0 ? `<div class="stat info">Info: ${report.totalInfo}</div>` : ''}
        </div>
    </div>
    
    ${!validationResult.valid ? `
    <div class="errors-container">
        ${Object.entries(report.groupedErrors).map(([type, errors]) => `
        <div class="error-group">
            <div class="error-group-title">${type}</div>
            ${errors.map(error => `
            <div class="error-item ${error.severity}">
                <div class="field">Field: ${error.field || 'N/A'}</div>
                <div class="message">${error.message}</div>
            </div>
            `).join('')}
        </div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>`;

    return html;
  }
}