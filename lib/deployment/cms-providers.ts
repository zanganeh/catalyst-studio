import { CMSProvider, CMSProviderId, ConnectionStatus } from './deployment-types';

export const CMS_PROVIDERS: Record<CMSProviderId, Omit<CMSProvider, 'connectionStatus' | 'config'>> = {
  optimizely: {
    id: 'optimizely',
    name: 'Optimizely',
    description: 'Enterprise-grade experimentation and content management platform',
    logo: '/images/cms/optimizely-logo.svg',
  },
  contentful: {
    id: 'contentful',
    name: 'Contentful',
    description: 'API-first content platform for digital experiences',
    logo: '/images/cms/contentful-logo.svg',
  },
  strapi: {
    id: 'strapi',
    name: 'Strapi',
    description: 'Open-source headless CMS for building powerful APIs',
    logo: '/images/cms/strapi-logo.svg',
  },
};

export const getProviderConfigFields = (providerId: CMSProviderId): Array<{
  name: string;
  label: string;
  type: 'text' | 'password' | 'url';
  required: boolean;
  placeholder?: string;
}> => {
  switch (providerId) {
    case 'optimizely':
      return [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'Enter your Optimizely API key' },
        { name: 'projectId', label: 'Project ID', type: 'text', required: true, placeholder: 'e.g., 12345678' },
        { name: 'environment', label: 'Environment', type: 'text', required: true, placeholder: 'e.g., production' },
      ];
    case 'contentful':
      return [
        { name: 'apiKey', label: 'Content Management API Token', type: 'password', required: true, placeholder: 'Enter your Contentful API token' },
        { name: 'workspace', label: 'Space ID', type: 'text', required: true, placeholder: 'e.g., abc123xyz' },
        { name: 'environment', label: 'Environment', type: 'text', required: true, placeholder: 'e.g., master' },
      ];
    case 'strapi':
      return [
        { name: 'endpoint', label: 'API Endpoint', type: 'url', required: true, placeholder: 'https://your-strapi-instance.com' },
        { name: 'apiKey', label: 'API Token', type: 'password', required: true, placeholder: 'Enter your Strapi API token' },
      ];
    default:
      return [];
  }
};

export const validateProviderConfig = (providerId: CMSProviderId, config: Record<string, string>): { valid: boolean; errors: string[] } => {
  const fields = getProviderConfigFields(providerId);
  const errors: string[] = [];

  fields.forEach(field => {
    if (field.required && !config[field.name]) {
      errors.push(`${field.label} is required`);
    }
    if (field.type === 'url' && config[field.name]) {
      try {
        new URL(config[field.name]);
      } catch {
        errors.push(`${field.label} must be a valid URL`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};