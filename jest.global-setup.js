const { execSync } = require('child_process');

module.exports = async () => {
  console.log('🧪 Setting up test environment...');
  
  try {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'file:./test.db';
    
    // Clean up any existing test database
    try {
      execSync('rm -f test.db test.db-journal', { stdio: 'ignore' });
    } catch (error) {
      // Ignore errors - files might not exist
    }
    
    // Generate Prisma client for test environment
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'pipe' });
    
    // Deploy migrations to test database
    console.log('🗄️ Setting up test database...');
    execSync('npx prisma migrate deploy', { stdio: 'pipe' });
    
    console.log('✅ Test environment setup complete');
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error.message);
    process.exit(1);
  }
};