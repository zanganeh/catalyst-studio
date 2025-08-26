# CLAUDE.md - Repository Instructions for AI Assistants

## CRITICAL: Repository Structure Rules

### Where to Place Files

#### Premium Features (Private Only)
**ALWAYS place under `lib/premium/` or `app/premium/`:**
- Premium components → `lib/premium/components/`
- Premium demos → `app/premium/demo/`
- Premium hooks → `lib/premium/hooks/`
- Premium utilities → `lib/premium/*.ts`

**NEVER place premium features in:**
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
# Premium components go under lib/premium/components/
mkdir -p lib/premium/components/new-feature
touch lib/premium/components/new-feature/index.tsx

# Premium demos go under app/premium/demo/
mkdir -p app/premium/demo/new-demo
touch app/premium/demo/new-demo/page.tsx

# NEVER create premium features here:
# ❌ components/premium/...
# ❌ app/demo/... (without premium prefix)
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

1. **DON'T** create premium components outside `lib/premium/components/`
2. **DON'T** import premium components in common code
3. **DON'T** push directly to origin (public) when working on premium
4. **DON'T** mix premium and common code in the same file
5. **DON'T** create premium demos outside `app/premium/demo/`

### Quick Reference

| Feature Type | Location | Push Command |
|-------------|----------|--------------|
| Premium Component | `lib/premium/components/` | `git push premium main` |
| Premium Demo | `app/premium/demo/` | `git push premium main` |
| Common UI | `components/ui/` | `git push premium main` |
| Bug Fix | Any common location | `git push premium main` |
| Core Feature | `app/` (non-premium), `lib/` | `git push premium main` |

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
# Create under app/premium/demo
mkdir -p app/premium/demo/new-demo
touch app/premium/demo/new-demo/page.tsx

# Commit and push
git add app/premium/demo/new-demo/
git commit -m "feat: add new premium demo"
git push premium main
```

## Summary

**Simple Rules**: 
- Premium components & hooks → `lib/premium/`
- Premium demos → `app/premium/demo/`
- Common → Standard locations
- Always push to `premium` remote (or `origin` if that's the only remote)
- Let GitHub Actions handle public sync