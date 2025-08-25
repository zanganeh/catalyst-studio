import { FooterProps } from './types';
import { isValidUrl } from '@/lib/premium/utils/url-validator';

export const footerSchema = {
  name: 'Footer',
  description: 'Site footer with links and company information',
  properties: {
    copyright: { type: 'string', required: false },
    columns: { type: 'array', required: false },
    socialLinks: { type: 'array', required: false }
  }
};

export type ValidationResult = { isValid: boolean; error?: string };

export const validateFooter = (props: Partial<FooterProps>): ValidationResult => {
  // Validate column link URLs
  if (props.columns && Array.isArray(props.columns)) {
    for (const column of props.columns) {
      if (column.links && Array.isArray(column.links)) {
        for (const link of column.links) {
          if (link.url && !isValidUrl(link.url)) {
            return { isValid: false, error: `Footer link URL "${link.url}" is invalid or potentially unsafe` };
          }
        }
      }
    }
  }
  
  // Validate social link URLs
  if (props.socialLinks && Array.isArray(props.socialLinks)) {
    for (const social of props.socialLinks) {
      if (social.url && !isValidUrl(social.url)) {
        return { isValid: false, error: `Social link URL "${social.url}" is invalid or potentially unsafe` };
      }
    }
  }
  
  return { isValid: true };
};