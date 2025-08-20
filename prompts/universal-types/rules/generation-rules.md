# Universal Type Generation Rules

## Rule 1: Check for Existing Types First
Before creating any new type, check if {{existingContentTypes}} already contains it.
Example: If BlogPost exists, don't create ArticlePage - suggest using BlogPost

## Rule 2: Use Only Available Primitive Types
All fields MUST use types from {{availableTypes}}:
- For short text (titles, names) → Use 'Text'
- For long content → Use 'LongText'
- For media → Use 'Media'
- For numbers → Use 'Number' or 'Decimal'
- For true/false → Use 'Boolean'
- For dates → Use 'Date'
- For structured data → Use 'JSON'

## Rule 3: Reuse Components
If {{reusableComponents}} includes ContentArea, use it for complex content
If CTAComponent exists, use it for call-to-action sections
Prefer existing components over creating new ones

## Rule 4: Follow Naming Conventions
- Type names: PascalCase (e.g., BlogPost, ProductPage)
- Field names: camelCase (e.g., pageTitle, publishDate)
- Component suffix for components (e.g., HeroComponent, CTAComponent)
- Page suffix for page types (e.g., ProductPage, ArticlePage)

## Rule 5: Field Requirements
- Every page type must have a 'title' field (Text, required)
- Every page type should have a 'slug' field for URL
- Components should be self-contained and reusable
- Avoid circular dependencies between types

## Rule 6: Validation Requirements
- Type name must be unique (not in {{existingContentTypes}})
- All field types must exist in {{availableTypes}}
- Required fields must have appropriate validation
- Field names must be unique within a type

## Rule 7: Category Classification
- Pages: Full standalone pages (BlogPost, ProductPage, LandingPage)
- Components: Reusable blocks (HeroComponent, CTAComponent, ContentArea)
- Choose based on reusability and independence

## Rule 8: Relationship Guidelines
- Use relationships for linking content types
- Prefer oneToMany for lists (e.g., blog has many posts)
- Use manyToMany for tags/categories
- Document relationship purpose clearly

## Rule 9: Performance Considerations
- Limit fields to what's necessary (avoid over-engineering)
- Use appropriate field types (don't use LongText for titles)
- Consider query performance when designing relationships

## Rule 10: Project Context Awareness
- All types are scoped to {{projectContext}}
- Consider project's industry and audience
- Align with existing design patterns in the project
- Maintain consistency with project's content strategy

## Validation Checklist
Before finalizing any type:
1. ✓ Name is unique and descriptive
2. ✓ All fields use valid primitive types
3. ✓ Required fields are marked appropriately
4. ✓ Similar existing types have been considered
5. ✓ Follows project naming conventions
6. ✓ Category (page/component) is correct
7. ✓ Relationships are properly defined
8. ✓ Validation rules are in place
9. ✓ Reusable components are leveraged
10. ✓ Aligns with project requirements