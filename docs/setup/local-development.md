# Local Development Setup Guide

## Overview
This guide provides step-by-step instructions for setting up Catalyst Studio for local development with Epic 7's Universal CMS Content Type Architecture.

## Prerequisites

### Required Software
- **Node.js**: v18.17.0 or higher (LTS recommended)
  - Verify: `node --version`
  - Download: https://nodejs.org/
  
- **npm**: v9.0.0 or higher (comes with Node.js)
  - Verify: `npm --version`
  
- **Git**: v2.30.0 or higher
  - Verify: `git --version`
  - Download: https://git-scm.com/

### Recommended Tools
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
- **Postman** or similar API testing tool
- **GitHub CLI** (for PR creation): https://cli.github.com/

## Step 1: Repository Setup

### Clone the Repository
```bash
# Clone via HTTPS
git clone https://github.com/zanganeh/catalyst-studio.git

# Or clone via SSH (if configured)
git clone git@github.com:zanganeh/catalyst-studio.git

# Navigate to project directory
cd catalyst-studio
```

### Verify Repository Structure
```bash
# List main directories
ls -la

# Expected structure:
# ├── app/              # Next.js application
# ├── components/       # React components
# ├── lib/             # Core libraries
# ├── docs/            # Documentation
# ├── mock-data/       # Mock CMS data
# └── .env.template    # Environment template
```

## Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# If you encounter issues, try:
npm cache clean --force
npm install

# Verify installation
npm list --depth=0
```

### Common Installation Issues

**Error: `EACCES` permissions error**
```bash
# Fix npm permissions (Unix/Mac)
sudo npm install -g npm@latest
```

**Error: `node-gyp` build errors**
```bash
# Windows: Install build tools
npm install --global windows-build-tools

# Mac: Install Xcode Command Line Tools
xcode-select --install
```

## Step 3: Environment Configuration

### Create Local Environment File
```bash
# Copy template to local environment file
cp .env.template .env.local

# Open in editor
code .env.local  # VS Code
# or
nano .env.local  # Terminal editor
```

### Configure Essential Variables

1. **For Development with Mock Data** (No API credentials needed):
```bash
# .env.local
PROVIDER_TYPE=mock
USE_MOCK_PROVIDER=true
MOCK_DATA_PATH=./mock-data
LOG_LEVEL=debug
ENABLE_PROVIDER_PATTERN=false
```

2. **For Development with Optimizely API**:
```bash
# .env.local
PROVIDER_TYPE=optimizely
OPTIMIZELY_API_KEY=your_api_key_here
OPTIMIZELY_PROJECT_ID=proj_XXXXXXXXXXXX
OPTIMIZELY_API_URL=https://api.optimizely.com/v2
USE_MOCK_PROVIDER=false
LOG_LEVEL=info
ENABLE_PROVIDER_PATTERN=false
```

See [Optimizely Credentials Guide](./optimizely-credentials.md) for obtaining API credentials.

## Step 4: Database Setup

### Option A: SQLite (Default for Development)
```bash
# Database is auto-created on first run
# Location: ./prisma/dev.db
DATABASE_URL="file:./dev.db"
```

### Option B: PostgreSQL (Optional)
```bash
# Install PostgreSQL locally or use Docker
docker run --name catalyst-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Configure in .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/catalyst_studio"
```

### Initialize Database
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed with sample data (if available)
npm run prisma:seed
```

## Step 5: Verify Setup

### Run Development Server
```bash
# Start the development server
npm run dev

# Expected output:
# > catalyst-studio@0.1.0 dev
# > next dev
# 
# ready - started server on http://localhost:3000
```

### Access Application
1. Open browser to http://localhost:3000
2. You should see the Catalyst Studio dashboard
3. Check browser console for any errors (F12)

### Verify Mock Data (if using mock provider)
```bash
# Test mock data loading
curl http://localhost:3000/api/providers/test

# Expected: JSON response with mock data
```

### Verify Optimizely Connection (if configured)
```bash
# Test API connection
curl http://localhost:3000/api/providers/health

# Expected: { "status": "connected", "provider": "optimizely" }
```

## Step 6: Development Workflow

### Start Development
```bash
# 1. Always pull latest changes
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Start development server
npm run dev

# 4. Open in browser
open http://localhost:3000
```

### Available NPM Scripts
```bash
# Development
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm start           # Start production server

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint        # Run ESLint
npm run lint:fix    # Auto-fix linting issues
npm run typecheck   # Run TypeScript compiler check

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio GUI
```

### Hot Module Replacement
The development server supports HMR:
- Code changes auto-reload in browser
- State is preserved during updates
- Fast refresh for React components

## Step 7: Testing Your Setup

### Basic Functionality Tests

1. **Check API Routes**:
```bash
# Health check
curl http://localhost:3000/api/health

# Provider status
curl http://localhost:3000/api/providers/status
```

2. **Verify Mock Data Loading**:
- Navigate to http://localhost:3000/content-types
- Should display mock content types if using mock provider

3. **Check Feature Flags**:
```javascript
// In browser console (F12)
fetch('/api/features').then(r => r.json()).then(console.log)
```

### Troubleshooting Checklist

- [ ] Node.js version is 18.17.0 or higher
- [ ] All dependencies installed successfully
- [ ] .env.local file exists and is configured
- [ ] Database is initialized (if using database features)
- [ ] No port conflicts on 3000 (default Next.js port)
- [ ] Mock data files exist in ./mock-data/ directory
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No linting errors: `npm run lint`

## Common Issues and Solutions

### Port Already in Use
```bash
# Error: Port 3000 is already in use

# Solution - Kill process on port:
npx kill-port 3000

# Or use different port:
npm run dev -- -p 3001
```

### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Not Loading
```bash
# Ensure .env.local exists
ls -la .env*

# Restart dev server after changing .env.local
# Ctrl+C to stop, then:
npm run dev
```

### TypeScript Errors
```bash
# Regenerate types
npm run prisma:generate
npm run typecheck
```

## Next Steps

1. **Configure Credentials**: Follow the [Optimizely Credentials Guide](./optimizely-credentials.md)
2. **Explore Mock Data**: Check `./mock-data/` for sample content structures
3. **Review Architecture**: Read Epic 7 architecture documentation
4. **Start Development**: Create your first feature branch and begin coding

## Support Resources

- [Troubleshooting Guide](./troubleshooting.md)
- [Project README](../../README.md)
- [Epic 7 Architecture](../epic7-architecture.md)
- [Epic 7 PRD](../epic7-prd.md)

## Development Tips

### Performance Optimization
- Use `npm run build && npm start` to test production build locally
- Monitor bundle size with `npm run analyze`
- Enable React DevTools Profiler for component performance

### Debugging
- Use VS Code debugger with launch configuration
- Enable verbose logging: `LOG_LEVEL=debug`
- Check Network tab in browser DevTools for API calls

### Git Workflow
- Commit often with meaningful messages
- Use conventional commits: `feat:`, `fix:`, `docs:`, etc.
- Run tests before pushing: `npm test`
- Create PR when feature is ready for review