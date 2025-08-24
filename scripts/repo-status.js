#!/usr/bin/env node

/**
 * Repository Status Tool
 * Shows the state of both public and premium repositories
 */

const { execSync } = require('child_process');

function runCommand(command, silent = true) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    if (!silent) console.error(`Error: ${error.message}`);
    return null;
  }
}

function getRepoStatus() {
  console.log('🔍 DUAL REPOSITORY STATUS');
  console.log('=' .repeat(60));
  
  // Current branch
  const currentBranch = runCommand('git branch --show-current');
  console.log(`\n📍 Current Branch: ${currentBranch}`);
  
  // Check remotes
  console.log('\n🔗 Configured Remotes:');
  const remotes = runCommand('git remote -v');
  console.log(remotes);
  
  // Public repo status
  console.log('\n📂 PUBLIC REPOSITORY (origin):');
  console.log('-'.repeat(40));
  const publicHead = runCommand('git log origin/main -1 --oneline');
  console.log(`Latest: ${publicHead || 'Not fetched'}`);
  
  // Premium repo status
  console.log('\n🔒 PREMIUM REPOSITORY (premium):');
  console.log('-'.repeat(40));
  const premiumHead = runCommand('git log premium/main -1 --oneline');
  console.log(`Latest: ${premiumHead || 'Not fetched'}`);
  
  // Commits only in premium
  console.log('\n💎 Premium-Only Commits:');
  console.log('-'.repeat(40));
  const premiumOnly = runCommand('git log origin/main..premium/main --oneline');
  if (premiumOnly) {
    console.log(premiumOnly);
  } else {
    console.log('None (repos are in sync)');
  }
  
  // Local commits not pushed
  console.log('\n📝 Unpushed Commits:');
  console.log('-'.repeat(40));
  const unpushedPublic = runCommand('git log origin/main..HEAD --oneline');
  const unpushedPremium = runCommand('git log premium/main..HEAD --oneline');
  
  if (unpushedPublic) {
    console.log('To public: ' + unpushedPublic.split('\n').length + ' commits');
  } else {
    console.log('To public: None');
  }
  
  if (unpushedPremium) {
    console.log('To premium: ' + unpushedPremium.split('\n').length + ' commits');
  } else {
    console.log('To premium: None');
  }
  
  // Working directory status
  console.log('\n📊 Working Directory:');
  console.log('-'.repeat(40));
  const status = runCommand('git status --porcelain');
  if (status) {
    const lines = status.split('\n');
    console.log(`${lines.length} files with changes`);
    
    // Count premium files
    const premiumFiles = lines.filter(line => 
      line.includes('premium/') || 
      line.includes('sitemap/professional') ||
      line.includes('sitemap/version') ||
      line.includes('sitemap/comments') ||
      line.includes('sitemap/ai-suggestions-enhanced') ||
      line.includes('sitemap/export-manager')
    );
    
    if (premiumFiles.length > 0) {
      console.log(`⚠️  ${premiumFiles.length} premium files modified`);
    }
  } else {
    console.log('Clean (no changes)');
  }
  
  // Quick guide
  console.log('\n📚 QUICK COMMANDS:');
  console.log('-'.repeat(40));
  console.log('Push to public only:    git push origin main');
  console.log('Push to premium only:   git push premium main');
  console.log('Push to both:           git push origin main && git push premium main');
  console.log('Fetch all:              git fetch --all');
  console.log('Check premium files:    node scripts/migrate-to-premium.js report');
}

// Main execution
getRepoStatus();