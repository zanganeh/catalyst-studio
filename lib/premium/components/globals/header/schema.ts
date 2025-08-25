import { HeaderProps } from './types';

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
  return { isValid: true };
};