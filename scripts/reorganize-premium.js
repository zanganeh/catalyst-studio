#!/usr/bin/env node

/**
 * One-time reorganization script
 * Moves premium files to premium/ subdirectories
 */

const fs = require('fs');
const path = require('path');

// Define moves: source -> destination
const MOVES = [
  // Move entire demo folder to premium
  { from: 'app/demo', to: 'app/premium-demo' },
  
  // Move premium sitemap components to premium subfolder
  { from: 'components/studio/sitemap/professional-nodes.tsx', to: 'components/premium/sitemap/professional-nodes.tsx' },
  { from: 'components/studio/sitemap/version-history.tsx', to: 'components/premium/sitemap/version-history.tsx' },
  { from: 'components/studio/sitemap/comments-system.tsx', to: 'components/premium/sitemap/comments-system.tsx' },
  { from: 'components/studio/sitemap/ai-suggestions-enhanced.tsx', to: 'components/premium/sitemap/ai-suggestions-enhanced.tsx' },
  { from: 'components/studio/sitemap/export-manager.tsx', to: 'components/premium/sitemap/export-manager.tsx' },
  { from: 'components/studio/sitemap/global-sections-library.tsx', to: 'components/premium/sitemap/global-sections-library.tsx' },
  { from: 'components/studio/sitemap/keyboard-shortcuts-help.tsx', to: 'components/premium/sitemap/keyboard-shortcuts-help.tsx' },
  { from: 'components/studio/sitemap/templates-modal.tsx', to: 'components/premium/sitemap/templates-modal.tsx' },
  { from: 'components/studio/sitemap/share-export-modal.tsx', to: 'components/premium/sitemap/share-export-modal.tsx' },
  { from: 'components/studio/sitemap/advanced-filters.tsx', to: 'components/premium/sitemap/advanced-filters.tsx' },
  { from: 'components/studio/sitemap/quick-actions-menu.tsx', to: 'components/premium/sitemap/quick-actions-menu.tsx' },
  { from: 'components/studio/sitemap/section-picker.tsx', to: 'components/premium/sitemap/section-picker.tsx' },
  { from: 'components/studio/sitemap/responsive-wrapper.tsx', to: 'components/premium/sitemap/responsive-wrapper.tsx' },
  { from: 'components/studio/sitemap/virtual-canvas.tsx', to: 'components/premium/sitemap/virtual-canvas.tsx' },
  
  // Move premium layouts
  { from: 'components/studio/deployment/demo-layout-fullwidth.tsx', to: 'components/premium/layouts/demo-layout-fullwidth.tsx' },
  
  // Move premium utilities
  { from: 'lib/sitemap/export-utils.ts', to: 'lib/premium/export-utils.ts' },
  { from: 'hooks/use-sitemap-performance.ts', to: 'hooks/premium/use-sitemap-performance.ts' },
  
  // Move avatar if it's premium-only
  { from: 'components/ui/avatar.tsx', to: 'components/premium/ui/avatar.tsx' },
];

function ensureDirectory(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

function moveFile(from, to) {
  const fromPath = path.join(process.cwd(), from);
  const toPath = path.join(process.cwd(), to);
  
  if (!fs.existsSync(fromPath)) {
    console.log(`⏭️  Skipped (not found): ${from}`);
    return false;
  }
  
  // Check if it's a directory
  const stats = fs.statSync(fromPath);
  if (stats.isDirectory()) {
    // Move entire directory
    ensureDirectory(toPath);
    moveDirectory(fromPath, toPath);
    // Remove original directory
    fs.rmSync(fromPath, { recursive: true, force: true });
    console.log(`📂 Moved directory: ${from} → ${to}`);
  } else {
    // Move single file
    ensureDirectory(toPath);
    fs.renameSync(fromPath, toPath);
    console.log(`✅ Moved: ${from} → ${to}`);
  }
  
  return true;
}

function moveDirectory(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  
  const files = fs.readdirSync(from);
  files.forEach(file => {
    const fromPath = path.join(from, file);
    const toPath = path.join(to, file);
    
    const stats = fs.statSync(fromPath);
    if (stats.isDirectory()) {
      moveDirectory(fromPath, toPath);
    } else {
      fs.renameSync(fromPath, toPath);
    }
  });
}

function updateImports() {
  console.log('\n📝 Import paths to update:');
  console.log('-'.repeat(40));
  
  // List files that might need import updates
  const filesToCheck = [
    'app/premium-demo/sitemap-builder/page.tsx',
    'app/premium-demo/export/page.tsx',
    'app/premium-demo/import/page.tsx',
    'app/premium-demo/wireframe/page.tsx',
    'app/premium-demo/style-guide/page.tsx',
  ];
  
  console.log('\nFiles that may need import updates:');
  filesToCheck.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`  📄 ${file}`);
    }
  });
  
  console.log('\n⚠️  Import updates needed:');
  console.log('  FROM: @/components/studio/sitemap/...');
  console.log('  TO:   @/components/premium/sitemap/...');
  console.log('');
  console.log('  FROM: @/components/ui/avatar');
  console.log('  TO:   @/components/premium/ui/avatar');
  console.log('');
  console.log('  FROM: @/lib/sitemap/export-utils');
  console.log('  TO:   @/lib/premium/export-utils');
}

function createGitCommands() {
  console.log('\n🔧 Git commands to run:');
  console.log('-'.repeat(40));
  console.log('git add -A');
  console.log('git commit -m "refactor: reorganize premium files into separate directories"');
  console.log('git push premium main');
}

// Main execution
function main() {
  console.log('🚀 PREMIUM FILES REORGANIZATION');
  console.log('=' .repeat(60));
  console.log('Moving premium files to premium/ subdirectories...\n');
  
  let movedCount = 0;
  let skippedCount = 0;
  
  MOVES.forEach(({ from, to }) => {
    if (moveFile(from, to)) {
      movedCount++;
    } else {
      skippedCount++;
    }
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log(`✅ Moved: ${movedCount} files/directories`);
  console.log(`⏭️  Skipped: ${skippedCount} items`);
  
  updateImports();
  createGitCommands();
  
  console.log('\n✨ Reorganization complete!');
  console.log('Next steps:');
  console.log('1. Update imports in the moved files');
  console.log('2. Test the application');
  console.log('3. Commit and push to premium repo');
}

// Add dry-run option
if (process.argv[2] === '--dry-run') {
  console.log('🔍 DRY RUN MODE - No files will be moved\n');
  MOVES.forEach(({ from, to }) => {
    const fromPath = path.join(process.cwd(), from);
    if (fs.existsSync(fromPath)) {
      console.log(`Would move: ${from} → ${to}`);
    } else {
      console.log(`Would skip: ${from} (not found)`);
    }
  });
} else {
  main();
}