# CLAUDE.md - Repository Instructions for AI Assistants

## CRITICAL: Repository Structure Rules

### Where to Place Files

#### Premium Features (Private Only)
**ALWAYS place under `lib/premium/`:**
- Premium components → `lib/premium/components/`
- Premium demos → `lib/premium/demo-app/`
- Premium hooks → `lib/premium/hooks/`
- Premium utilities → `lib/premium/*.ts`

**NEVER place premium features in:**
- ❌ `app/` (except under `lib/premium/demo-app/`)
- ❌ `components/` (except under `lib/premium/components/`)
- ❌ `hooks/` (except under `lib/premium/hooks/`)

#### Common Features (Both Repositories)
**Place in standard locations:**
- Shared UI → `components/ui/`
- Core features → `app/`
- Shared utilities → `lib/` (NOT under `lib/premium/`)
- Shared hooks → `hooks/` (NOT under `hooks/premium/`)

### Git Push Rules

#### Working with Premium Features
```bash
# When adding/modifying premium features:
git add .
git commit -m "feat: [description]"
git push premium main  # Push to premium repository
# DO NOT push to origin (public repo)
```

#### Working with Common Features
```bash
# When fixing bugs or adding open-source features:
git add .
git commit -m "fix: [description]"
git push premium main  # Push to premium (triggers auto-sync to public)
# The GitHub Action will automatically sync to public
```

### Import Path Rules

#### For Premium Components
```typescript
// CORRECT - Premium imports
import { ProfessionalNode } from '@/lib/premium/components/sitemap/professional-nodes'
import { usePerformance } from '@/lib/premium/hooks/use-performance'

// WRONG - Never use these paths
import { ProfessionalNode } from '@/components/premium/...'  // ❌
import { Something } from '@/app/premium-demo/...'  // ❌
```

#### For Common Components
```typescript
// CORRECT - Common imports (available in both repos)
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```

### File Creation Guidelines

#### Creating a Premium Feature
```bash
# ALWAYS create under lib/premium/
mkdir -p lib/premium/components/new-feature
touch lib/premium/components/new-feature/index.tsx

# NEVER create premium features here:
# ❌ components/premium/...
# ❌ app/premium/...
# ❌ app/demo/...
```

#### Creating a Common Feature
```bash
# Create in standard locations
touch components/ui/new-component.tsx  # Shared UI component
touch app/new-page/page.tsx           # Public page
touch lib/utils/helper.ts             # Shared utility
```

### Repository Management

#### Current Setup
- **Premium Repository**: `catalyst-studio-premium` (private)
- **Public Repository**: `catalyst-studio` (open source)
- **Auto-sync**: GitHub Action removes `lib/premium/` when syncing to public

#### Git Remotes Configuration
```bash
# Already configured:
origin  → catalyst-studio (public)
premium → catalyst-studio-premium (private)
```

### Common Mistakes to Avoid

1. **DON'T** create premium features outside `lib/premium/`
2. **DON'T** import premium components in common code
3. **DON'T** push directly to origin (public) when working on premium
4. **DON'T** mix premium and common code in the same file
5. **DON'T** create `app/premium-demo/` - use `lib/premium/demo-app/`

### Quick Reference

| Feature Type | Location | Push Command |
|-------------|----------|--------------|
| Premium Component | `lib/premium/components/` | `git push premium main` |
| Premium Demo | `lib/premium/demo-app/` | `git push premium main` |
| Common UI | `components/ui/` | `git push premium main` |
| Bug Fix | Any common location | `git push premium main` |
| Core Feature | `app/`, `lib/` | `git push premium main` |

### Verification Checklist

Before committing:
- [ ] Premium features are under `lib/premium/`?
- [ ] No premium imports in common code?
- [ ] Using correct import paths?
- [ ] Pushing to `premium` remote?

### Examples

#### Adding a Premium Sitemap Feature
```bash
# Create file in correct location
mkdir -p lib/premium/components/sitemap
touch lib/premium/components/sitemap/advanced-feature.tsx

# Commit and push
git add lib/premium/components/sitemap/advanced-feature.tsx
git commit -m "feat: add advanced sitemap feature"
git push premium main
```

#### Fixing a Bug in Common Component
```bash
# Edit common component
vim components/ui/button.tsx

# Commit and push (will sync to both repos)
git add components/ui/button.tsx
git commit -m "fix: button click handler issue"
git push premium main
```

#### Adding a New Demo (Premium)
```bash
# Create under lib/premium/demo-app
mkdir -p lib/premium/demo-app/new-demo
touch lib/premium/demo-app/new-demo/page.tsx

# Commit and push
git add lib/premium/demo-app/new-demo/
git commit -m "feat: add new premium demo"
git push premium main
```

## Summary

**One Simple Rule**: 
- Premium → `lib/premium/` only
- Common → Standard locations
- Always push to `premium` remote
- Let GitHub Actions handle public sync