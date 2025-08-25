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

export const validateHeader = (props: Partial<HeaderProps>): boolean => {
  return !!props.logo && props.logo.trim().length > 0;
};