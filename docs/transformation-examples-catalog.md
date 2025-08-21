# Transformation Examples Catalog

## Overview

This catalog provides real-world examples of content type transformations between Universal format and platform-specific formats. Each example includes the transformation process, confidence scoring, and fallback strategies.

## Table of Contents

1. [Optimizely → Universal Transformations](#optimizely--universal-transformations)
2. [Universal → Optimizely Transformations](#universal--optimizely-transformations)
3. [Confidence Scoring Examples](#confidence-scoring-examples)
4. [Fallback Strategy Demonstrations](#fallback-strategy-demonstrations)
5. [Troubleshooting Failed Transformations](#troubleshooting-failed-transformations)

## Optimizely → Universal Transformations

### Example 1: Simple Blog Post

**Optimizely Type:**
```csharp
[ContentType(DisplayName = "Blog Post")]
public class BlogPost : PageData
{
    [Display(Name = "Title")]
    public virtual string Title { get; set; }
    
    [Display(Name = "Slug")]
    public virtual string UrlSegment { get; set; }
    
    [Display(Name = "Author")]
    public virtual string Author { get; set; }
    
    [Display(Name = "Publish Date")]
    public virtual DateTime PublishDate { get; set; }
    
    [Display(Name = "Main Content")]
    public virtual XhtmlString MainBody { get; set; }
    
    [Display(Name = "Featured Image")]
    public virtual ContentReference FeaturedImage { get; set; }
}
```

**Universal Type (Transformed):**
```typescript
{
  "name": "BlogPost",
  "category": "page",
  "fields": [
    {
      "name": "title",
      "type": "Text",
      "required": true,
      "metadata": {
        "originalName": "Title",
        "originalType": "String"
      }
    },
    {
      "name": "slug",
      "type": "Text",
      "required": true,
      "metadata": {
        "originalName": "UrlSegment",
        "originalType": "String"
      }
    },
    {
      "name": "author",
      "type": "Text",
      "required": false,
      "metadata": {
        "originalName": "Author",
        "originalType": "String"
      }
    },
    {
      "name": "publishDate",
      "type": "DateTime",
      "required": false,
      "metadata": {
        "originalName": "PublishDate",
        "originalType": "DateTime"
      }
    },
    {
      "name": "mainContent",
      "type": "LongText",
      "required": false,
      "metadata": {
        "originalName": "MainBody",
        "originalType": "XhtmlString"
      }
    },
    {
      "name": "featuredImage",
      "type": "Media",
      "required": false,
      "metadata": {
        "originalName": "FeaturedImage",
        "originalType": "ContentReference"
      }
    }
  ],
  "metadata": {
    "source": "Optimizely",
    "originalTypeName": "BlogPost",
    "confidence": 100,
    "transformedAt": "2025-01-21T10:00:00Z"
  }
}
```

**Transformation Notes:**
- Direct mapping for all fields
- XhtmlString → LongText (rich content)
- ContentReference → Media (for image reference)
- Confidence: 100% (all fields mapped directly)

### Example 2: Product Page with Complex Fields

**Optimizely Type:**
```csharp
[ContentType(DisplayName = "Product Page")]
public class ProductPage : PageData
{
    public virtual string ProductName { get; set; }
    public virtual double Price { get; set; }
    public virtual ContentArea Features { get; set; }
    public virtual IList<ContentReference> RelatedProducts { get; set; }
    public virtual string JsonMetadata { get; set; } // Stored as JSON string
}
```

**Universal Type (Transformed):**
```typescript
{
  "name": "ProductPage",
  "category": "page",
  "fields": [
    {
      "name": "productName",
      "type": "Text",
      "required": false,
      "metadata": {
        "originalName": "ProductName",
        "originalType": "String"
      }
    },
    {
      "name": "price",
      "type": "Decimal",
      "required": false,
      "metadata": {
        "originalName": "Price",
        "originalType": "Double"
      }
    },
    {
      "name": "features",
      "type": "ContentArea",
      "required": false,
      "metadata": {
        "originalName": "Features",
        "originalType": "ContentArea"
      }
    },
    {
      "name": "relatedProducts",
      "type": "ContentReference",
      "required": false,
      "metadata": {
        "originalName": "RelatedProducts",
        "originalType": "IList<ContentReference>",
        "multiple": true
      }
    },
    {
      "name": "jsonMetadata",
      "type": "JSON",
      "required": false,
      "metadata": {
        "originalName": "JsonMetadata",
        "originalType": "String",
        "note": "Parsed from JSON string"
      }
    }
  ],
  "metadata": {
    "source": "Optimizely",
    "originalTypeName": "ProductPage",
    "confidence": 95,
    "transformedAt": "2025-01-21T10:00:00Z"
  }
}
```

**Transformation Notes:**
- Double → Decimal (precise numeric)
- ContentArea preserved (native support)
- IList<ContentReference> → ContentReference with multiple flag
- JSON string parsed to JSON type
- Confidence: 95% (JSON required parsing)

### Example 3: Component Block

**Optimizely Block:**
```csharp
[ContentType(DisplayName = "Hero Section")]
public class HeroBlock : BlockData
{
    public virtual string Heading { get; set; }
    public virtual string Subheading { get; set; }
    public virtual ContentReference BackgroundImage { get; set; }
    public virtual Url ButtonLink { get; set; }
    public virtual string ButtonText { get; set; }
}
```

**Universal Type (Transformed):**
```typescript
{
  "name": "HeroSection",
  "category": "component",
  "fields": [
    {
      "name": "heading",
      "type": "Text",
      "required": false
    },
    {
      "name": "subheading",
      "type": "Text",
      "required": false
    },
    {
      "name": "backgroundImage",
      "type": "Media",
      "required": false
    },
    {
      "name": "buttonLink",
      "type": "URL",
      "required": false
    },
    {
      "name": "buttonText",
      "type": "Text",
      "required": false
    }
  ],
  "metadata": {
    "source": "Optimizely",
    "originalTypeName": "HeroBlock",
    "confidence": 100,
    "transformedAt": "2025-01-21T10:00:00Z"
  }
}
```

**Transformation Notes:**
- BlockData → component category
- Url → URL type
- All mappings direct
- Confidence: 100%

## Universal → Optimizely Transformations

### Example 4: Event Page Creation

**Universal Type:**
```typescript
{
  "name": "EventPage",
  "category": "page",
  "fields": [
    {
      "name": "title",
      "type": "Text",
      "required": true
    },
    {
      "name": "slug",
      "type": "Text",
      "required": true
    },
    {
      "name": "eventDate",
      "type": "DateTime",
      "required": true
    },
    {
      "name": "location",
      "type": "Text",
      "required": true
    },
    {
      "name": "description",
      "type": "LongText",
      "required": true
    },
    {
      "name": "capacity",
      "type": "Number",
      "required": false
    },
    {
      "name": "registrationEmail",
      "type": "Email",
      "required": false
    },
    {
      "name": "eventType",
      "type": "Select",
      "required": true,
      "metadata": {
        "options": ["conference", "webinar", "workshop", "meetup"]
      }
    }
  ]
}
```

**Optimizely Type (Generated):**
```csharp
[ContentType(
    DisplayName = "Event Page",
    Description = "Page for event information",
    GUID = "generated-guid-here"
)]
public class EventPage : PageData
{
    [Display(
        Name = "Title",
        Order = 10,
        GroupName = SystemTabNames.Content
    )]
    [Required]
    public virtual string Title { get; set; }
    
    [Display(
        Name = "Slug",
        Order = 20
    )]
    [Required]
    public virtual string UrlSegment { get; set; }
    
    [Display(
        Name = "Event Date",
        Order = 30
    )]
    [Required]
    public virtual DateTime EventDate { get; set; }
    
    [Display(
        Name = "Location",
        Order = 40
    )]
    [Required]
    public virtual string Location { get; set; }
    
    [Display(
        Name = "Description",
        Order = 50
    )]
    [Required]
    public virtual XhtmlString Description { get; set; }
    
    [Display(
        Name = "Capacity",
        Order = 60
    )]
    public virtual int? Capacity { get; set; }
    
    [Display(
        Name = "Registration Email",
        Order = 70
    )]
    [RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
        ErrorMessage = "Please enter a valid email address")]
    public virtual string RegistrationEmail { get; set; }
    
    [Display(
        Name = "Event Type",
        Order = 80
    )]
    [SelectOne(SelectionFactoryType = typeof(EventTypeSelectionFactory))]
    [Required]
    public virtual string EventType { get; set; }
}

// Selection Factory for Event Type
public class EventTypeSelectionFactory : ISelectionFactory
{
    public IEnumerable<ISelectItem> GetSelections(ExtendedMetadata metadata)
    {
        return new ISelectItem[]
        {
            new SelectItem() { Text = "Conference", Value = "conference" },
            new SelectItem() { Text = "Webinar", Value = "webinar" },
            new SelectItem() { Text = "Workshop", Value = "workshop" },
            new SelectItem() { Text = "Meetup", Value = "meetup" }
        };
    }
}
```

**Transformation Notes:**
- Text → String with Required attribute
- LongText → XhtmlString
- Number → int? (nullable)
- Email → String with RegularExpression validation
- Select → String with SelectionFactory
- Confidence: 90% (Email field uses fallback with validation)

### Example 5: Complex Component with Fallbacks

**Universal Type:**
```typescript
{
  "name": "ProductFeature",
  "category": "component",
  "fields": [
    {
      "name": "featureName",
      "type": "Text",
      "required": true
    },
    {
      "name": "featureIcon",
      "type": "Media",
      "required": false
    },
    {
      "name": "benefits",
      "type": "MultiSelect",
      "required": false,
      "metadata": {
        "options": ["speed", "reliability", "scalability", "security", "ease-of-use"]
      }
    },
    {
      "name": "technicalSpecs",
      "type": "JSON",
      "required": false
    }
  ]
}
```

**Optimizely Block (Generated with Fallbacks):**
```csharp
[ContentType(
    DisplayName = "Product Feature",
    Description = "Component for product features"
)]
public class ProductFeatureBlock : BlockData
{
    [Display(Name = "Feature Name")]
    [Required]
    public virtual string FeatureName { get; set; }
    
    [Display(Name = "Feature Icon")]
    [UIHint(UIHint.Image)]
    public virtual ContentReference FeatureIcon { get; set; }
    
    [Display(Name = "Benefits")]
    // FALLBACK: MultiSelect stored as comma-separated string
    public virtual string Benefits { get; set; }
    
    [Display(Name = "Technical Specs")]
    // FALLBACK: JSON stored as string
    [UIHint("JsonEditor")]
    public virtual string TechnicalSpecs { get; set; }
}

// Helper methods for handling fallbacks
public static class ProductFeatureHelper
{
    public static List<string> GetBenefitsList(string benefits)
    {
        if (string.IsNullOrEmpty(benefits))
            return new List<string>();
        return benefits.Split(',').Select(b => b.Trim()).ToList();
    }
    
    public static void SetBenefitsList(ProductFeatureBlock block, List<string> benefits)
    {
        block.Benefits = string.Join(",", benefits);
    }
    
    public static dynamic GetTechnicalSpecs(string specsJson)
    {
        if (string.IsNullOrEmpty(specsJson))
            return null;
        return JsonConvert.DeserializeObject(specsJson);
    }
    
    public static void SetTechnicalSpecs(ProductFeatureBlock block, object specs)
    {
        block.TechnicalSpecs = JsonConvert.SerializeObject(specs);
    }
}
```

**Transformation Notes:**
- MultiSelect → String (comma-separated) with helper methods
- JSON → String with JsonEditor UIHint
- Helper methods provided for data handling
- Confidence: 75% (two fallbacks required)

## Confidence Scoring Examples

### Example 6: High Confidence Transformation (95%)

**Input:**
```typescript
{
  "name": "ArticlePage",
  "category": "page",
  "fields": [
    { "name": "title", "type": "Text", "required": true },
    { "name": "content", "type": "LongText", "required": true },
    { "name": "publishDate", "type": "DateTime", "required": true },
    { "name": "author", "type": "Text", "required": true }
  ]
}
```

**Confidence Calculation:**
```
Base Score: 100%
- All fields have direct mappings: 0% deduction
- Proper naming conventions: 0% deduction
- Valid category: 0% deduction
- Page has required fields (title): 0% deduction
- Minor: author could use ContentReference: -5%

Final Confidence: 95%
Threshold: Automatic application
```

### Example 7: Medium Confidence Transformation (65%)

**Input:**
```typescript
{
  "name": "CustomWidget",
  "category": "component",
  "fields": [
    { "name": "configuration", "type": "JSON", "required": true },
    { "name": "items", "type": "MultiSelect", "required": true },
    { "name": "customScript", "type": "Text", "required": false }
  ]
}
```

**Confidence Calculation:**
```
Base Score: 100%
- JSON field requires fallback: -15%
- MultiSelect requires fallback: -15%
- customScript might need special handling: -5%

Final Confidence: 65%
Threshold: Manual review required
```

### Example 8: Low Confidence Transformation (40%)

**Input:**
```typescript
{
  "name": "complex-form",  // Wrong naming convention
  "category": "widget",     // Invalid category
  "fields": [
    { "name": "Field1", "type": "CustomType", "required": true },
    { "name": "Field1", "type": "Text", "required": false }  // Duplicate
  ]
}
```

**Confidence Calculation:**
```
Base Score: 100%
- Invalid category: -25%
- Wrong naming convention: -5%
- Invalid field type: -15%
- Duplicate field name: -10%
- Poor field naming: -5%

Final Confidence: 40%
Threshold: Rejection recommended
```

## Fallback Strategy Demonstrations

### Example 9: Simple Fallback (Email → String)

**Universal Field:**
```typescript
{
  "name": "contactEmail",
  "type": "Email",
  "required": true,
  "validation": [
    { "type": "email", "message": "Must be valid email" }
  ]
}
```

**Optimizely Fallback:**
```csharp
[Display(Name = "Contact Email")]
[Required]
[RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
    ErrorMessage = "Please enter a valid email address")]
public virtual string ContactEmail { get; set; }
```

**Strategy:**
- Type: Simple fallback to String
- Validation preserved via RegularExpression
- Confidence impact: -5%

### Example 10: Serialization Fallback (JSON → String)

**Universal Field:**
```typescript
{
  "name": "metadata",
  "type": "JSON",
  "required": false,
  "metadata": {
    "schema": {
      "type": "object",
      "properties": {
        "tags": { "type": "array" },
        "version": { "type": "string" }
      }
    }
  }
}
```

**Optimizely Fallback:**
```csharp
[Display(Name = "Metadata")]
[UIHint("JsonEditor")]
[BackingType(typeof(PropertyLongString))]
public virtual string Metadata { get; set; }

// Usage helper
public T GetMetadata<T>() where T : class
{
    if (string.IsNullOrEmpty(Metadata))
        return null;
    
    try
    {
        return JsonConvert.DeserializeObject<T>(Metadata);
    }
    catch
    {
        return null;
    }
}

public void SetMetadata<T>(T data) where T : class
{
    Metadata = JsonConvert.SerializeObject(data, Formatting.Indented);
}
```

**Strategy:**
- Type: Serialization fallback
- Helper methods for type-safe access
- UIHint for better editor experience
- Confidence impact: -15%

### Example 11: Decomposition Fallback (ContentArea → Multiple Fields)

**Universal Field:**
```typescript
{
  "name": "flexibleContent",
  "type": "ContentArea",
  "required": false,
  "metadata": {
    "allowedTypes": ["TextBlock", "ImageBlock", "VideoBlock"]
  }
}
```

**Platform Without ContentArea Support:**
```typescript
// Decomposed into separate fields
{
  "textBlocks": {
    "type": "Array",
    "itemType": "ContentReference",
    "metadata": { "contentType": "TextBlock" }
  },
  "imageBlocks": {
    "type": "Array",
    "itemType": "ContentReference",
    "metadata": { "contentType": "ImageBlock" }
  },
  "videoBlocks": {
    "type": "Array",
    "itemType": "ContentReference",
    "metadata": { "contentType": "VideoBlock" }
  },
  "blockOrder": {
    "type": "JSON",
    "metadata": {
      "description": "Maintains original block ordering"
    }
  }
}
```

**Strategy:**
- Type: Decomposition fallback
- Separate typed arrays
- Order preservation via JSON
- Requires custom rendering logic
- Confidence impact: -30%

## Troubleshooting Failed Transformations

### Issue 1: Unsupported Field Type

**Problem:**
```typescript
{
  "name": "locationMap",
  "type": "GeoLocation",  // Not a universal type
  "required": true
}
```

**Error:**
```json
{
  "error": "Unknown field type: GeoLocation",
  "field": "locationMap",
  "suggestion": "Use JSON type with geographic data structure"
}
```

**Solution:**
```typescript
{
  "name": "locationMap",
  "type": "JSON",
  "required": true,
  "metadata": {
    "structure": {
      "lat": "number",
      "lng": "number",
      "address": "string"
    }
  }
}
```

### Issue 2: Circular References

**Problem:**
```typescript
{
  "name": "CategoryPage",
  "fields": [
    {
      "name": "parentCategory",
      "type": "ContentReference",
      "metadata": { "referenceType": "CategoryPage" }  // Self-reference
    },
    {
      "name": "childCategories",
      "type": "ContentReference",
      "metadata": { 
        "referenceType": "CategoryPage",
        "multiple": true
      }
    }
  ]
}
```

**Solution:**
```csharp
// Add validation to prevent circular references
public override ActionResult Index(CategoryPage currentPage)
{
    // Check for circular references
    var visited = new HashSet<ContentReference>();
    if (HasCircularReference(currentPage.ContentLink, visited))
    {
        // Handle circular reference
        return View("Error", "Circular reference detected");
    }
    
    return View(currentPage);
}

private bool HasCircularReference(ContentReference current, HashSet<ContentReference> visited)
{
    if (visited.Contains(current))
        return true;
    
    visited.Add(current);
    
    var page = ContentLoader.Get<CategoryPage>(current);
    if (page.ParentCategory != null)
    {
        return HasCircularReference(page.ParentCategory, visited);
    }
    
    return false;
}
```

### Issue 3: Platform Limitations

**Problem:**
Platform doesn't support more than 50 fields per content type.

**Error:**
```json
{
  "error": "Content type exceeds platform field limit",
  "limit": 50,
  "actual": 67,
  "platform": "Contentful"
}
```

**Solution:**
```typescript
// Split into main type and extension
{
  "name": "ProductPage",
  "category": "page",
  "fields": [
    // Core fields (first 40)
    { "name": "title", "type": "Text", "required": true },
    // ... other core fields
    {
      "name": "extendedData",
      "type": "ContentReference",
      "metadata": {
        "referenceType": "ProductPageExtension"
      }
    }
  ]
}

// Extension type for additional fields
{
  "name": "ProductPageExtension",
  "category": "component",
  "fields": [
    // Additional fields (remaining 27)
    { "name": "technicalSpecs", "type": "JSON", "required": false },
    // ... other extended fields
  ]
}
```

### Issue 4: Validation Conflicts

**Problem:**
Universal validation rules conflict with platform constraints.

**Universal:**
```typescript
{
  "name": "username",
  "type": "Text",
  "validation": [
    { "type": "minLength", "value": 3 },
    { "type": "maxLength", "value": 50 },
    { "type": "pattern", "value": "^[a-zA-Z0-9_]+$" }
  ]
}
```

**Platform Error:**
Platform only supports maxLength for text fields.

**Solution:**
```csharp
// Implement custom validator
public class UsernameValidator : IValidate<IContent>
{
    public IEnumerable<ValidationError> Validate(IContent instance)
    {
        var page = instance as IContentWithUsername;
        if (page == null) yield break;
        
        var username = page.Username;
        
        if (username?.Length < 3)
        {
            yield return new ValidationError
            {
                ErrorMessage = "Username must be at least 3 characters",
                PropertyName = nameof(page.Username),
                Severity = ValidationErrorSeverity.Error
            };
        }
        
        if (!Regex.IsMatch(username ?? "", "^[a-zA-Z0-9_]+$"))
        {
            yield return new ValidationError
            {
                ErrorMessage = "Username can only contain letters, numbers, and underscores",
                PropertyName = nameof(page.Username),
                Severity = ValidationErrorSeverity.Error
            };
        }
    }
}
```

## Best Practices for Transformations

1. **Always Preserve Metadata**
   - Keep original field names and types
   - Document transformation decisions
   - Include confidence scores

2. **Implement Bidirectional Transformations**
   - Ensure data can round-trip
   - Test both directions thoroughly
   - Handle edge cases

3. **Provide Helper Methods**
   - For complex fallbacks
   - For data serialization/deserialization
   - For validation logic

4. **Document Limitations**
   - Platform constraints
   - Data loss risks
   - Performance implications

5. **Test with Real Data**
   - Use production-like content
   - Test edge cases
   - Verify performance

6. **Monitor Transformation Success**
   - Track confidence scores
   - Log failures
   - Measure performance

7. **Version Transformations**
   - Track changes over time
   - Support backward compatibility
   - Plan migration paths

8. **Handle Errors Gracefully**
   - Provide clear error messages
   - Suggest remediation steps
   - Allow manual overrides

9. **Optimize for Common Cases**
   - Cache transformation results
   - Batch similar transformations
   - Minimize API calls

10. **Keep Transformations Idempotent**
    - Same input → same output
    - No side effects
    - Predictable behavior