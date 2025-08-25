import { FooterProps } from './types';

export const footerSchema = {
  name: 'Footer',
  description: 'Site footer with links and company information',
  properties: {
    copyright: { type: 'string', required: false },
    columns: { type: 'array', required: false },
    socialLinks: { type: 'array', required: false }
  }
};

export const validateFooter = (props: Partial<FooterProps>): boolean => {
  return true;
};