const glob = require('glob');
const fs = require('fs');
const path = require('path');

// Find all global component index files
const componentPattern = './lib/premium/components/globals/*/index.tsx';
const components = glob.sync(componentPattern);

// Generate registry data
const registry = components.map(filePath => {
  // Normalize path separators for cross-platform compatibility
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Extract component name from path
  const pathParts = normalizedPath.split('/');
  const componentName = pathParts[pathParts.length - 2]; // folder name before index.tsx
  
  return {
    name: componentName,
    // Convert to import path format
    path: normalizedPath
      .replace('./lib/premium/components/globals/', '@/lib/premium/components/globals/')
      .replace('/index.tsx', '')
  };
});

// Generate TypeScript file content
const fileContent = `// Generated component registry - DO NOT EDIT MANUALLY
// Run 'npm run build:components' to regenerate

export interface ComponentRegistryEntry {
  name: string;
  path: string;
}

export const COMPONENT_REGISTRY: ComponentRegistryEntry[] = ${JSON.stringify(registry, null, 2)};

// Helper function to get component by name
export function getComponentByName(name: string): ComponentRegistryEntry | undefined {
  return COMPONENT_REGISTRY.find(c => c.name === name);
}

// Export component names for type safety
export type ComponentName = ${registry.length > 0 ? registry.map(c => `'${c.name}'`).join(' | ') : 'never'};
`;

// Ensure directory exists
const outputDir = path.dirname('./lib/premium/components/component-registry.generated.ts');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write the generated file
fs.writeFileSync('./lib/premium/components/component-registry.generated.ts', fileContent);

console.log(`✓ Generated component registry with ${registry.length} components`);
if (registry.length > 0) {
  console.log('  Components:', registry.map(c => c.name).join(', '));
}