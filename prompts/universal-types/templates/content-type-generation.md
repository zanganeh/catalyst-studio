# Generate Universal Content Type

## Current Project Context:
Project: {{projectContext}}
Industry: {{projectIndustry}}
Target Audience: {{targetAudience}}

## Available Building Blocks:

### Primitive Types:
{{availableTypes}}

### Existing Types in Project:
{{existingContentTypes}}

### Reusable Components:
{{reusableComponents}}

### Common Properties:
{{commonProperties}}

## Your Task:
Create a content type that:
1. Doesn't duplicate existing types listed above
2. Uses only primitive types from the available list
3. Reuses components and properties where applicable
4. Follows the project's established patterns
5. Serves a clear purpose in the content model

## Requirements:
- Check {{existingContentTypes}} first - reuse if 80%+ match
- All fields must use types from {{availableTypes}}
- Leverage {{reusableComponents}} for complex content areas
- Follow naming: PascalCase for types, camelCase for fields
- Include validation rules for required fields

## Output Format:
```json
{
  "name": "TypeName",
  "category": "page|component",
  "purpose": "Clear description of what this type is for",
  "fields": [
    {
      "name": "fieldName",
      "type": "Text|LongText|Number|Boolean|Date|Media|JSON",
      "required": true|false,
      "label": "Human-readable label",
      "helpText": "Helper text for editors",
      "validation": {
        "minLength": 1,
        "maxLength": 255
      }
    }
  ],
  "relationships": [
    {
      "name": "relatedItems",
      "type": "oneToMany|manyToOne|manyToMany",
      "targetType": "ExistingTypeName",
      "required": false
    }
  ],
  "confidence": 85,
  "reasoning": "Explanation of design decisions"
}
```

## Examples of Good Patterns:
- Reusing existing 'CTAComponent' instead of creating new button component
- Using 'ContentArea' for flexible content sections
- Leveraging 'Media' type for images and videos
- Following established field naming in project

## Common Mistakes to Avoid:
- Creating ArticlePage when BlogPost already exists
- Using String when Text is the proper primitive
- Over-engineering with too many optional fields
- Missing required validation on critical fields
- Circular dependencies between types