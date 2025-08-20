# Check for Duplicate Types

## Requested Type: 
[User's Request]: {{requestedType}}

## Existing Types in Project:
{{existingContentTypes}}

## Analysis Steps:

### Step 1: Exact Name Match
Check if type name exactly matches any in {{existingContentTypes}}
- Result: [FOUND/NOT_FOUND]
- Matching Type: [TypeName if found]

### Step 2: Semantic Similarity
Check for types with similar purpose:
- BlogPost ≈ ArticlePage ≈ NewsItem
- ProductPage ≈ ItemPage ≈ CatalogItem
- LandingPage ≈ MarketingPage ≈ CampaignPage
- Result: [SIMILAR_FOUND/NO_SIMILAR]
- Similar Types: [List if found]

### Step 3: Field Overlap Analysis
Compare requested fields with existing types:
- 80%+ overlap → Use existing type
- 50-79% overlap → Consider extending existing
- <50% overlap → Safe to create new
- Result: [Percentage]% overlap with [TypeName]

### Step 4: Component Reusability Check
Identify which existing components can be reused:
- Available: {{reusableComponents}}
- Can Reuse: [List applicable components]

## Decision Matrix:
| Check | Result | Action |
|-------|--------|--------|
| Exact Match | Yes/No | Use existing / Continue |
| Semantic Match | Yes/No | Suggest existing / Continue |
| Field Overlap | >80% | Use existing type |
| Field Overlap | 50-79% | Extend existing type |
| Field Overlap | <50% | Create new type |

## Final Recommendation:

### IF Duplicate Found:
```json
{
  "action": "USE_EXISTING",
  "existingType": "TypeName",
  "reason": "80% field overlap with existing BlogPost type",
  "confidence": 95,
  "suggestion": "Use BlogPost type with minor field additions if needed"
}
```

### IF Extension Recommended:
```json
{
  "action": "EXTEND_EXISTING",
  "baseType": "TypeName",
  "newFields": ["field1", "field2"],
  "reason": "65% overlap, only needs 2 additional fields",
  "confidence": 85
}
```

### IF New Type Needed:
```json
{
  "action": "CREATE_NEW",
  "reason": "No significant overlap with existing types",
  "reuseComponents": ["ContentArea", "CTAComponent"],
  "confidence": 90,
  "proceed": true
}
```

## Reusability Guidelines:
- Always prefer existing types when possible
- Extension is better than duplication
- Component reuse reduces complexity
- Consistency improves maintainability