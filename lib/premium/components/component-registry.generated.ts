// Generated component registry - DO NOT EDIT MANUALLY
// Run 'npm run build:components' to regenerate

export interface ComponentRegistryEntry {
  name: string;
  path: string;
}

export const COMPONENT_REGISTRY: ComponentRegistryEntry[] = [
  {
    "name": "hero",
    "path": "@/lib/premium/components/globals/hero"
  },
  {
    "name": "header",
    "path": "@/lib/premium/components/globals/header"
  },
  {
    "name": "footer",
    "path": "@/lib/premium/components/globals/footer"
  },
  {
    "name": "cta",
    "path": "@/lib/premium/components/globals/cta"
  }
];

// Helper function to get component by name
export function getComponentByName(name: string): ComponentRegistryEntry | undefined {
  return COMPONENT_REGISTRY.find(c => c.name === name);
}

// Export component names for type safety
export type ComponentName = 'hero' | 'header' | 'footer' | 'cta';
