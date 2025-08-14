const { execSync } = require('child_process');

module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Clean up test database files
    execSync('rm -f test.db test.db-journal', { stdio: 'ignore' });
    
    console.log('✅ Test environment cleanup complete');
  } catch (error) {
    console.warn('⚠️ Warning during cleanup:', error.message);
    // Don't fail the test run for cleanup issues
  }
};