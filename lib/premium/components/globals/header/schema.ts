import { HeaderProps } from './types';
import { isValidUrl } from '@/lib/premium/utils/url-validator';

export const headerSchema = {
  name: 'Header',
  description: 'Site header with navigation and branding',
  properties: {
    logo: { type: 'string', required: true },
    menuItems: { type: 'array', required: false },
    ctaButton: { type: 'object', required: false },
    sticky: { type: 'boolean', required: false }
  }
};

export type ValidationResult = { isValid: boolean; error?: string };

export const validateHeader = (props: Partial<HeaderProps>): ValidationResult => {
  if (!props.logo || props.logo.trim().length === 0) {
    return { isValid: false, error: 'Logo is required and cannot be empty' };
  }
  
  // Validate menu item URLs
  if (props.menuItems && Array.isArray(props.menuItems)) {
    for (const item of props.menuItems) {
      if (item.url && !isValidUrl(item.url)) {
        return { isValid: false, error: `Menu item URL "${item.url}" is invalid or potentially unsafe` };
      }
    }
  }
  
  // Validate CTA button URL
  if (props.ctaButton?.url && !isValidUrl(props.ctaButton.url)) {
    return { isValid: false, error: 'CTA button URL is invalid or potentially unsafe' };
  }
  
  return { isValid: true };
};