# Troubleshooting Guide

This guide covers common issues you might encounter while setting up or developing with Catalyst Studio.

## Table of Contents

- [Database Issues](#database-issues)
- [Development Server Issues](#development-server-issues)
- [Prisma Issues](#prisma-issues)
- [Environment Variables](#environment-variables)
- [Build and Deployment](#build-and-deployment)
- [Performance Issues](#performance-issues)

---

## Database Issues

### Database Connection Errors

#### Error: "Can't reach database server"

**Cause**: Database server is not running or connection string is incorrect.

**Solutions**:
1. Check your `DATABASE_URL` in `.env.local`:
   ```env
   DATABASE_URL="file:./dev.db"  # For SQLite
   ```

2. For PostgreSQL/MySQL, ensure the database server is running:
   ```bash
   # PostgreSQL
   sudo service postgresql status
   
   # MySQL
   sudo service mysql status
   ```

3. Verify connection string format:
   - SQLite: `file:./dev.db`
   - PostgreSQL: `postgresql://user:password@localhost:5432/dbname`
   - MySQL: `mysql://user:password@localhost:3306/dbname`

#### Error: "Database file is locked"

**Cause**: Multiple processes trying to access SQLite database.

**Solutions**:
1. Stop all running processes:
   ```bash
   # Kill all Node processes (use with caution)
   npx kill-port 3000
   npm run db:studio  # Stop if running
   ```

2. Remove lock files:
   ```bash
   rm dev.db-journal
   rm dev.db-wal
   rm dev.db-shm
   ```

### Migration Conflicts

#### Error: "Migration already applied"

**Cause**: Database state doesn't match migration history.

**Solutions**:
1. Reset migrations:
   ```bash
   npm run db:reset -- --force
   npm run db:migrate
   ```

2. For production, use:
   ```bash
   npm run db:migrate:deploy
   ```

#### Error: "Schema drift detected"

**Cause**: Database schema modified outside of migrations.

**Solutions**:
1. Create a new migration to sync:
   ```bash
   npm run db:migrate:create
   ```

2. Or reset to clean state:
   ```bash
   npm run db:fresh
   ```

---

## Development Server Issues

### Port Already in Use

#### Error: "Port 3000 is already in use"

**Solutions**:
1. Kill the process using the port:
   ```bash
   # Cross-platform solution
   npx kill-port 3000
   
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <process_id> /F
   
   # Mac/Linux
   lsof -i :3000
   kill -9 <process_id>
   ```

2. Use a different port:
   ```bash
   PORT=3001 npm run dev
   ```

### Hot Reload Not Working

**Cause**: File watching issues or cache problems.

**Solutions**:
1. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. Check file permissions:
   ```bash
   # Ensure write permissions
   chmod -R 755 .
   ```

3. Restart with cache clear:
   ```bash
   npm run dev -- --turbopack
   ```

---

## Prisma Issues

### Prisma Client Generation

#### Error: "Cannot find module '@prisma/client'"

**Solutions**:
1. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

2. Reinstall dependencies:
   ```bash
   rm -rf node_modules lib/generated
   npm install
   npm run db:generate
   ```

#### Error: "EPERM: operation not permitted" (Windows)

**Cause**: File permission issues on Windows.

**Solutions**:
1. Stop all Node processes:
   ```bash
   taskkill /F /IM node.exe
   ```

2. Run as administrator:
   - Open terminal as Administrator
   - Run generation command again

3. Disable antivirus temporarily during generation

### Prisma Studio Issues

#### Error: "Prisma Studio keeps crashing"

**Solutions**:
1. Clear Prisma Studio cache:
   ```bash
   rm -rf ~/.prisma/studio
   ```

2. Use specific port:
   ```bash
   BROWSER=none npx prisma studio --port 5556
   ```

---

## Environment Variables

### Variables Not Loading

#### Error: "OPENROUTER_API_KEY is not defined"

**Solutions**:
1. Check file exists:
   ```bash
   ls -la .env.local
   ```

2. Verify format:
   ```env
   # .env.local
   OPENROUTER_API_KEY=sk-or-v1-xxxxx
   DATABASE_URL="file:./dev.db"
   ```

3. Restart dev server after changes:
   ```bash
   # Ctrl+C to stop
   npm run dev
   ```

### Multiple Environment Files

**Load Order** (highest to lowest priority):
1. `.env.local` - Local overrides (git-ignored)
2. `.env.development` - Development defaults
3. `.env` - Shared defaults

---

## Build and Deployment

### Build Failures

#### Error: "Module not found"

**Solutions**:
1. Clean install:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Check imports case sensitivity:
   ```javascript
   // Wrong on case-sensitive systems
   import Component from './component'
   
   // Correct
   import Component from './Component'
   ```

#### Error: "Out of memory"

**Solutions**:
1. Increase Node memory:
   ```bash
   NODE_OPTIONS="--max-old-space-size=8192" npm run build
   ```

2. Clear caches:
   ```bash
   rm -rf .next
   npm run build
   ```

### TypeScript Errors

#### Error: "Type error in production build"

**Solutions**:
1. Run type check:
   ```bash
   npm run typecheck
   ```

2. Fix or temporarily ignore:
   ```typescript
   // @ts-ignore - temporary fix
   ```

---

## Performance Issues

### Slow Database Queries

**Solutions**:
1. Add indexes to schema:
   ```prisma
   model ContentItem {
     @@index([websiteId])
     @@index([contentTypeId])
   }
   ```

2. Run migrations:
   ```bash
   npm run db:migrate
   ```

### Memory Leaks

**Debugging**:
1. Monitor memory:
   ```bash
   # In development
   NODE_OPTIONS="--inspect" npm run dev
   ```

2. Use Chrome DevTools:
   - Navigate to `chrome://inspect`
   - Click "inspect" under Remote Target
   - Use Memory profiler

---

## Debugging Commands

### Useful Debugging Commands

```bash
# Check Node version
node --version

# Check npm version
npm --version

# View installed packages
npm list

# Check Prisma version
npx prisma --version

# Validate schema
npx prisma validate

# Database introspection
npx prisma db pull

# View current migrations
npx prisma migrate status

# Environment info
npx envinfo --system --binaries --browsers
```

### Logging

Enable debug logging:
```bash
# Prisma debug
DEBUG="prisma:*" npm run dev

# Next.js debug
DEBUG="*" npm run dev
```

---

## Getting Help

If you're still experiencing issues:

1. **Check existing issues**: [GitHub Issues](https://github.com/your-username/catalyst-studio/issues)
2. **Search documentation**: Review README.md and this guide
3. **Ask for help**: Create a new issue with:
   - Error message (full stack trace)
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)
   - What you've already tried

### Quick System Info

Run this command and include output when reporting issues:
```bash
npx envinfo --system --binaries --browsers --npmPackages "{react,next,prisma,@prisma/client,typescript}"
```

---

## Common Quick Fixes

```bash
# Nuclear option - reset everything
rm -rf node_modules .next lib/generated dev.db dev.db-*
npm install
npm run db:setup
npm run dev

# Quick database reset
npm run db:fresh

# Fix permissions (Mac/Linux)
chmod -R 755 .
chown -R $(whoami) .

# Fix permissions (Windows - run as admin)
icacls . /grant Everyone:F /T
```