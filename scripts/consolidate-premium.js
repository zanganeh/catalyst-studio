#!/usr/bin/env node

/**
 * Consolidate all premium content under premium folders
 */

const fs = require('fs');
const path = require('path');

function moveDirectory(from, to) {
  const fromPath = path.join(process.cwd(), from);
  const toPath = path.join(process.cwd(), to);
  
  if (!fs.existsSync(fromPath)) {
    console.log(`⏭️  Source not found: ${from}`);
    return false;
  }
  
  // Create target directory
  const targetDir = path.dirname(toPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Move directory
  fs.renameSync(fromPath, toPath);
  console.log(`✅ Moved: ${from} → ${to}`);
  return true;
}

function consolidate() {
  console.log('🎯 CONSOLIDATING PREMIUM CONTENT');
  console.log('=' .repeat(60));
  
  // Move app/premium-demo to lib/premium/demo-app
  console.log('\nMoving demo app to lib/premium...');
  moveDirectory('app/premium-demo', 'lib/premium/demo-app');
  
  // Also move components/premium to lib/premium/components
  console.log('\nMoving premium components to lib/premium...');
  moveDirectory('components/premium', 'lib/premium/components');
  
  // Move hooks/premium to lib/premium/hooks
  console.log('\nMoving premium hooks to lib/premium...');
  moveDirectory('hooks/premium', 'lib/premium/hooks');
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ All premium content now under lib/premium/');
  console.log('\nNew structure:');
  console.log('  lib/premium/');
  console.log('    ├── demo-app/        (demos)');
  console.log('    ├── components/      (premium components)');
  console.log('    ├── hooks/           (premium hooks)');
  console.log('    └── export-utils.ts  (utilities)');
  
  console.log('\n📝 Next steps:');
  console.log('1. Update imports in moved files');
  console.log('2. Update GitHub Action to only remove lib/premium');
  console.log('3. Commit and push');
}

consolidate();