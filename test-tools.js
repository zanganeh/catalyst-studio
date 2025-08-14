// Test script to check tool exports
try {
  const path = require('path');
  const tsNode = require('ts-node');
  
  // Register ts-node for TypeScript support
  tsNode.register({
    transpileOnly: true,
    compilerOptions: {
      module: 'commonjs',
      moduleResolution: 'node',
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      resolveJsonModule: true,
      jsx: 'react-jsx',
      paths: {
        "@/*": ["./src/*", "./*"]
      }
    }
  });

  // Import the tools
  const { tools, allTools } = require('./lib/ai-tools/tools/index.ts');
  
  console.log('Tools object keys:', Object.keys(tools || {}));
  console.log('AllTools is array:', Array.isArray(allTools));
  console.log('AllTools length:', allTools ? allTools.length : 0);
  
  // Check if individual tools are defined
  console.log('\nIndividual tool checks:');
  console.log('getWebsiteContext:', !!tools?.getWebsiteContext);
  console.log('echoTool:', !!tools?.echoTool);
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}