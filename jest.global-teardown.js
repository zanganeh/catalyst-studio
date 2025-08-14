/**
 * Jest Global Teardown
 * Runs after all tests to clean up the test environment
 */

const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Clean up test files and artifacts
    const testDbPath = path.join(__dirname, 'test.db');
    const testDbJournalPath = path.join(__dirname, 'test.db-journal');
    
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    if (fs.existsSync(testDbJournalPath)) {
      fs.unlinkSync(testDbJournalPath);
    }
    
    console.log('✅ Test environment cleanup complete');
  } catch (error) {
    console.warn('⚠️ Test cleanup warning:', error.message);
  }
};