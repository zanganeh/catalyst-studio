/**
 * Jest Global Setup
 * Runs before all tests to set up the test environment
 */

const { execSync } = require('child_process');

module.exports = async () => {
  console.log('🔧 Setting up test environment...');
  
  try {
    // Ensure test database is clean and migrated
    if (process.env.NODE_ENV === 'test') {
      // Clean and setup test database
      console.log('📦 Setting up test database...');
      execSync('npm run test:db:reset', { stdio: 'inherit' });
    }
    
    console.log('✅ Test environment setup complete');
  } catch (error) {
    console.error('❌ Test environment setup failed:', error.message);
    process.exit(1);
  }
};