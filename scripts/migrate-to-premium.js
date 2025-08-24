#!/usr/bin/env node

/**
 * Migration Script: Organize Premium vs Open Source Features
 * This script helps identify and organize files for dual repository management
 */

const fs = require('fs');
const path = require('path');

// Premium features - based on your pending changes
const PREMIUM_FILES = [
  // Premium sitemap components
  'components/studio/sitemap/professional-nodes.tsx',
  'components/studio/sitemap/version-history.tsx',
  'components/studio/sitemap/comments-system.tsx',
  'components/studio/sitemap/ai-suggestions-enhanced.tsx',
  'components/studio/sitemap/export-manager.tsx',
  'components/studio/sitemap/global-sections-library.tsx',
  'components/studio/sitemap/keyboard-shortcuts-help.tsx',
  'components/studio/sitemap/templates-modal.tsx',
  'components/studio/sitemap/share-export-modal.tsx',
  'components/studio/sitemap/advanced-filters.tsx',
  'components/studio/sitemap/quick-actions-menu.tsx',
  'components/studio/sitemap/section-picker.tsx',
  'components/studio/sitemap/responsive-wrapper.tsx',
  'components/studio/sitemap/virtual-canvas.tsx',
  
  // Premium demo layouts
  'components/studio/deployment/demo-layout-fullwidth.tsx',
  
  // Premium utilities
  'lib/sitemap/export-utils.ts',
  'hooks/use-sitemap-performance.ts',
  
  // Premium demo pages
  'app/demo/sitemap-builder/sitemap-print.css',
  
  // UI components that might be premium
  'components/ui/avatar.tsx', // Check if this is premium-only
];

// Files that have both open source and premium code mixed
const MIXED_FILES = [
  'app/demo/sitemap-builder/page.tsx', // Has premium features integrated
];

// Generate report
function generateMigrationReport() {
  console.log('🔍 CATALYST STUDIO - MIGRATION REPORT\n');
  console.log('=' .repeat(60));
  
  // Check premium files status
  console.log('\n📦 PREMIUM FILES STATUS:');
  console.log('-'.repeat(40));
  
  let premiumCount = 0;
  let missingCount = 0;
  
  PREMIUM_FILES.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
      premiumCount++;
    } else {
      console.log(`❌ ${file} (not found)`);
      missingCount++;
    }
  });
  
  console.log(`\nFound: ${premiumCount} premium files`);
  console.log(`Missing: ${missingCount} files`);
  
  // Check mixed files
  console.log('\n⚠️  MIXED FILES (need refactoring):');
  console.log('-'.repeat(40));
  
  MIXED_FILES.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      console.log(`📝 ${file} - Contains both open source and premium code`);
    }
  });
  
  // Provide recommendations
  console.log('\n📋 RECOMMENDATIONS:');
  console.log('-'.repeat(40));
  console.log('1. Premium files should be moved to premium/ subdirectories');
  console.log('2. Mixed files need to be refactored to separate concerns');
  console.log('3. Use environment variables to conditionally load premium features');
  console.log('4. Update imports to use dynamic loading for premium components');
  
  // Git strategy
  console.log('\n🔧 GIT STRATEGY:');
  console.log('-'.repeat(40));
  console.log('1. Commit all current changes to premium remote:');
  console.log('   git add .');
  console.log('   git commit -m "feat: premium sitemap features"');
  console.log('   git push premium main');
  console.log('');
  console.log('2. For open source updates, push to both:');
  console.log('   git push origin main');
  console.log('   git push premium main');
  console.log('');
  console.log('3. Create .gitignore entries for public repo:');
  console.log('   **/premium/**');
  console.log('   *.premium.*');
  console.log('   components/studio/sitemap/professional-*');
  
  // Environment setup
  console.log('\n🔐 ENVIRONMENT SETUP:');
  console.log('-'.repeat(40));
  console.log('Add to .env for feature flags:');
  console.log('NEXT_PUBLIC_FEATURE_LEVEL=opensource  # or premium');
  console.log('NEXT_PUBLIC_ENABLE_PREMIUM=false      # or true');
  
  // Next steps
  console.log('\n📌 NEXT STEPS:');
  console.log('-'.repeat(40));
  console.log('1. Run: npm run migrate:structure');
  console.log('2. Update imports in mixed files');
  console.log('3. Test both opensource and premium modes');
  console.log('4. Commit and push appropriately');
}

// Create folder structure
function createFolderStructure() {
  const premiumDirs = [
    'components/premium',
    'components/premium/sitemap',
    'lib/premium',
    'hooks/premium',
    'app/premium-demo',
  ];
  
  console.log('\n📁 Creating premium folder structure...\n');
  
  premiumDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Created: ${dir}`);
    } else {
      console.log(`📂 Exists: ${dir}`);
    }
  });
}

// Create gitignore for public repo
function createPublicGitignore() {
  const gitignoreContent = `
# Premium features (not in public repo)
**/premium/**
components/studio/sitemap/professional-*
components/studio/sitemap/version-*
components/studio/sitemap/comments-*
components/studio/sitemap/ai-suggestions-enhanced*
components/studio/sitemap/export-manager*
components/studio/sitemap/global-sections*
components/studio/sitemap/templates-modal*
components/studio/sitemap/share-export*
components/studio/sitemap/advanced-filters*
components/studio/sitemap/quick-actions*
components/studio/sitemap/section-picker*
components/studio/sitemap/responsive-wrapper*
components/studio/sitemap/virtual-canvas*
components/studio/deployment/demo-layout-fullwidth*
lib/sitemap/export-utils*
hooks/use-sitemap-performance*
*.premium.*
premium.config.*

# Premium environment files
.env.premium
.env.production
`;

  const gitignorePath = path.join(process.cwd(), '.gitignore.public');
  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log('\n✅ Created .gitignore.public for public repository');
}

// Main execution
function main() {
  const command = process.argv[2];
  
  if (command === 'report') {
    generateMigrationReport();
  } else if (command === 'structure') {
    createFolderStructure();
    createPublicGitignore();
    console.log('\n✅ Folder structure created successfully!');
    console.log('📝 Next: Run "node scripts/migrate-to-premium.js report" for migration report');
  } else {
    console.log('Catalyst Studio - Premium Migration Tool\n');
    console.log('Usage:');
    console.log('  node scripts/migrate-to-premium.js report    - Generate migration report');
    console.log('  node scripts/migrate-to-premium.js structure - Create folder structure');
  }
}

main();