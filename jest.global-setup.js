/**
 * Jest Global Setup
 * Runs before all tests to set up the test environment
 */

const { execSync } = require('child_process');

module.exports = async () => {
  console.log('🧪 Setting up test environment...');
  
  try {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    // Load DATABASE_URL from .env.test for PostgreSQL
    require('dotenv').config({ path: '.env.test' });
    
    // Generate Prisma client for test environment
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'pipe' });
    
    // Deploy migrations to test database
    console.log('🗄️ Setting up test database...');
    execSync('npx prisma migrate deploy', { stdio: 'pipe' });
    
    // Alternative method if test:db:reset is available
    if (process.env.USE_DB_RESET_SCRIPT) {
      console.log('📦 Using test:db:reset script...');
      execSync('npm run test:db:reset', { stdio: 'inherit' });
    }
    
    console.log('✅ Test environment setup complete');
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error.message);
    process.exit(1);
  }
};