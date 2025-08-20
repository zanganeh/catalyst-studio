# Sanity Extensions (Post-MVP)

This directory will contain Sanity-specific type extensions in a future release.

## Expected Extensions

### Content Types
- **Document**: Base content type
- **Portable Text**: Rich text format
- **Reference**: Document references
- **Asset**: Images and files
- **Object**: Nested structures

### Field Types
- **String**: Text input
- **Text**: Multi-line text
- **Number**: Numeric values
- **Boolean**: True/false
- **Date**: Date values
- **Datetime**: Date with time
- **URL**: URL validation
- **Slug**: URL-friendly identifiers
- **Image**: Image uploads with metadata
- **File**: File uploads
- **Array**: Lists of any type
- **Object**: Nested objects
- **Reference**: Document references
- **Geopoint**: Geographic coordinates

### Platform-Specific Features
- **Portable Text**: Flexible rich text format
- **GROQ**: Graph-oriented query language
- **Real-time Collaboration**: Live editing
- **Custom Input Components**: React-based inputs
- **Validation Rules**: Custom validation logic
- **Preview**: Live preview functionality
- **Localization**: Field-level translations

## Implementation Priority
1. Basic field type mappings
2. Portable Text transformation
3. Reference handling
4. Asset management
5. Real-time features

## Migration Considerations
- Portable Text complexity
- GROQ query translation
- Custom component handling
- Real-time sync requirements
- Preview functionality