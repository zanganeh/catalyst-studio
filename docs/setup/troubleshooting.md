# Troubleshooting Guide

## Overview
This guide helps resolve common issues when setting up and using Catalyst Studio with Epic 7's Universal CMS Content Type Architecture.

## Quick Diagnostics

### Health Check Commands
```bash
# Check Node.js version
node --version  # Should be >= 18.17.0

# Check npm version  
npm --version   # Should be >= 9.0.0

# Check environment variables are loaded
npm run env:check  # Custom script to verify .env.local

# Test API connection (if configured)
curl http://localhost:3000/api/providers/health

# Check mock data is accessible
curl http://localhost:3000/api/providers/test
```

## Common Issues and Solutions

### 1. Credential and Authentication Issues

#### Invalid API Key Error
**Error Message:**
```
Error: 401 Unauthorized - Invalid API key
OptimizelyError: Authentication failed
```

**Causes & Solutions:**

1. **Incorrect API Key Format**
   - Verify no extra spaces or line breaks in the key
   - Check for proper quotes in .env.local file
   ```bash
   # Wrong
   OPTIMIZELY_API_KEY= abc123 
   OPTIMIZELY_API_KEY="abc123"
   
   # Correct
   OPTIMIZELY_API_KEY=abc123
   ```

2. **Key Not Loading from Environment**
   ```bash
   # Debug: Print environment variable
   echo $OPTIMIZELY_API_KEY
   
   # If empty, restart dev server
   npm run dev
   ```

3. **Expired or Revoked Key**
   - Generate new key in Optimizely admin panel
   - Update .env.local with new key
   - Restart development server

#### Insufficient Permissions Error
**Error Message:**
```
Error: 403 Forbidden - Insufficient scopes for this operation
```

**Solution:**
1. Regenerate API key with all required scopes:
   - Content Type Read/Write
   - Content Read/Write
   - Media Read/Write
   - Publishing Read/Write

2. Verify scopes in Optimizely admin:
   ```
   Settings → API Keys → [Your Key] → View Scopes
   ```

#### Project Not Found
**Error Message:**
```
Error: 404 Not Found - Project with ID 'xxx' not found
```

**Solutions:**
1. Verify Project ID format includes `proj_` prefix
2. Check Project ID in Optimizely admin: Settings → Project Information
3. Ensure API key has access to the specified project

### 2. Network and Connection Issues

#### CORS Errors
**Error Message:**
```
Access to fetch at 'https://api.optimizely.com' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions:**
1. **Use server-side API calls** (recommended):
   ```javascript
   // pages/api/optimizely/[...path].js
   // Proxy API calls through Next.js API routes
   ```

2. **Configure CORS in Optimizely** (if available):
   - Add `http://localhost:3000` to allowed origins
   - Contact Optimizely support if needed

#### Connection Timeout
**Error Message:**
```
Error: ETIMEDOUT - Connection timeout to api.optimizely.com
```

**Solutions:**
1. **Check network connectivity:**
   ```bash
   # Test connection to Optimizely
   ping api.optimizely.com
   curl -I https://api.optimizely.com/v2
   ```

2. **Firewall/Proxy Issues:**
   - Check corporate firewall settings
   - Configure proxy if required:
   ```bash
   # .env.local
   HTTP_PROXY=http://proxy.company.com:8080
   HTTPS_PROXY=http://proxy.company.com:8080
   ```

3. **Use Mock Provider:**
   ```bash
   # .env.local
   USE_MOCK_PROVIDER=true
   PROVIDER_TYPE=mock
   ```

#### Rate Limiting
**Error Message:**
```
Error: 429 Too Many Requests - Rate limit exceeded
```

**Solutions:**
1. **Implement exponential backoff:**
   ```javascript
   // lib/utils/api-retry.js
   async function retryWithBackoff(fn, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (error.status === 429 && i < maxRetries - 1) {
           await new Promise(resolve => 
             setTimeout(resolve, Math.pow(2, i) * 1000)
           );
         } else {
           throw error;
         }
       }
     }
   }
   ```

2. **Cache API responses:**
   - Implement Redis or in-memory caching
   - Use stale-while-revalidate pattern

3. **Contact Optimizely support** for rate limit increase

### 3. Development Environment Issues

#### Port Already in Use
**Error Message:**
```
Error: Port 3000 is already in use
```

**Solutions:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001

# Find what's using the port (Windows)
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Find what's using the port (Mac/Linux)
lsof -i :3000
kill -9 <process_id>
```

#### Module Not Found
**Error Message:**
```
Error: Cannot find module 'xxx'
Module not found: Can't resolve 'xxx'
```

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Verify package is in package.json
npm list xxx

# Install missing package
npm install xxx
```

#### Environment Variables Not Loading
**Error Message:**
```
TypeError: Cannot read properties of undefined (reading 'OPTIMIZELY_API_KEY')
```

**Solutions:**
1. **Verify .env.local exists:**
   ```bash
   ls -la .env*
   # Should show .env.local
   ```

2. **Check file encoding:**
   - Ensure UTF-8 encoding
   - No BOM (Byte Order Mark)

3. **Restart dev server after changes:**
   ```bash
   # Ctrl+C to stop
   npm run dev
   ```

4. **Debug environment loading:**
   ```javascript
   // pages/api/debug/env.js
   export default function handler(req, res) {
     res.json({
       loaded: !!process.env.OPTIMIZELY_API_KEY,
       provider: process.env.PROVIDER_TYPE
     });
   }
   ```

### 4. TypeScript and Build Issues

#### TypeScript Compilation Errors
**Error Message:**
```
Type error: Property 'xxx' does not exist on type 'yyy'
```

**Solutions:**
```bash
# Regenerate Prisma types
npm run prisma:generate

# Check TypeScript version
npx tsc --version

# Run type check
npm run typecheck

# Clean TypeScript cache
rm -rf .next
npm run build
```

#### Build Failures
**Error Message:**
```
Build error occurred
Error: Failed to compile
```

**Solutions:**
```bash
# Clean build cache
rm -rf .next
rm -rf node_modules/.cache

# Rebuild
npm run build

# Check for linting errors
npm run lint

# Fix linting issues
npm run lint:fix
```

### 5. Database Issues

#### Database Connection Failed
**Error Message:**
```
Error: P1001: Can't reach database server
```

**Solutions:**
1. **For SQLite:**
   ```bash
   # Ensure database file exists
   ls -la prisma/dev.db
   
   # Reset database
   npm run prisma:migrate:reset
   ```

2. **For PostgreSQL:**
   ```bash
   # Check PostgreSQL is running
   pg_isready
   
   # Test connection
   psql -U postgres -h localhost -p 5432
   ```

#### Migration Errors
**Error Message:**
```
Error: P3009: migrate found failed migrations
```

**Solutions:**
```bash
# Reset database (WARNING: Deletes all data)
npm run prisma:migrate:reset

# Apply migrations manually
npm run prisma:migrate:deploy

# Generate fresh migration
npm run prisma:migrate:dev
```

### 6. Mock Provider Issues

#### Mock Data Not Loading
**Error Message:**
```
Error: Mock data file not found
```

**Solutions:**
1. **Verify mock data exists:**
   ```bash
   ls -la mock-data/optimizely/
   # Should show: content-types.json, pages.json, blocks.json
   ```

2. **Check mock provider is enabled:**
   ```bash
   # .env.local
   USE_MOCK_PROVIDER=true
   PROVIDER_TYPE=mock
   MOCK_DATA_PATH=./mock-data
   ```

3. **Validate JSON syntax:**
   ```bash
   # Check for JSON errors
   npx jsonlint mock-data/optimizely/content-types.json
   ```

## Debugging Tools and Techniques

### Enable Debug Logging
```bash
# .env.local
LOG_LEVEL=debug
PROVIDER_DEBUG_MODE=true
```

### Browser DevTools
1. **Network Tab**: Monitor API calls
2. **Console**: Check for JavaScript errors
3. **Application Tab**: Inspect cookies and local storage

### API Testing with cURL
```bash
# Test Optimizely connection
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.optimizely.com/v2/projects/YOUR_PROJECT_ID

# Test local API endpoint
curl http://localhost:3000/api/providers/status
```

### VS Code Debugging
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "skipFiles": ["<node_internals>/**"],
      "env": {
        "LOG_LEVEL": "debug"
      }
    }
  ]
}
```

## Performance Troubleshooting

### Slow API Responses
1. Enable caching for API responses
2. Use pagination for large datasets
3. Implement request batching
4. Consider using CDN for static assets

### High Memory Usage
```bash
# Monitor memory usage
npm run dev -- --max-old-space-size=4096

# Check for memory leaks
npm run test:memory
```

## Getting Help

### Self-Service Resources
1. Check [Epic 7 Documentation](../epic7-prd.md)
2. Review [Architecture Guide](../epic7-architecture.md)
3. Search [GitHub Issues](https://github.com/zanganeh/catalyst-studio/issues)

### Community Support
- GitHub Discussions: https://github.com/zanganeh/catalyst-studio/discussions
- Discord: [Join our server](https://discord.gg/catalyst-studio)
- Stack Overflow: Tag `catalyst-studio`

### Professional Support
- Email: support@catalyst-studio.com
- Enterprise Support: enterprise@catalyst-studio.com

## Preventive Measures

### Regular Maintenance
1. **Update dependencies monthly:**
   ```bash
   npm update
   npm audit fix
   ```

2. **Rotate API keys quarterly:**
   - Development: Every 90 days
   - Production: Every 30 days

3. **Monitor logs for warnings:**
   ```bash
   npm run logs:analyze
   ```

### Best Practices
1. Always use environment variables for sensitive data
2. Never commit .env files to version control
3. Use mock provider for development when possible
4. Implement proper error handling
5. Add comprehensive logging
6. Write tests for critical paths
7. Document custom configurations

## Emergency Procedures

### Complete Reset
```bash
# WARNING: This will delete all local data
rm -rf node_modules .next package-lock.json
rm -rf prisma/dev.db
git clean -fd
git reset --hard HEAD
npm install
npm run prisma:migrate:reset
npm run dev
```

### Rollback to Last Working State
```bash
git stash
git checkout main
git pull origin main
npm install
npm run dev
```

## Verification Checklist

After troubleshooting, verify:
- [ ] Development server starts without errors
- [ ] Can access http://localhost:3000
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No linting errors: `npm run lint`
- [ ] Tests pass: `npm test`
- [ ] API health check passes
- [ ] Mock data loads (if using mock provider)
- [ ] Can create/read content types
- [ ] Database operations work
- [ ] No console errors in browser