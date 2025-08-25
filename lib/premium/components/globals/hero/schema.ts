import { HeroProps } from './types';
import { isValidUrl } from '@/lib/premium/utils/url-validator';

export const heroSchema = {
  name: 'Hero Section',
  description: 'Prominent section with headline and call-to-action',
  properties: {
    title: { type: 'string', required: true },
    subtitle: { type: 'string', required: false },
    buttonText: { type: 'string', required: false },
    buttonUrl: { type: 'string', required: false }
  }
};

export type ValidationResult = { isValid: boolean; error?: string };

export const validateHero = (props: Partial<HeroProps>): ValidationResult => {
  if (!props.title || props.title.trim().length === 0) {
    return { isValid: false, error: 'Title is required and cannot be empty' };
  }
  
  // Validate URL if provided
  if (props.buttonUrl && !isValidUrl(props.buttonUrl)) {
    return { isValid: false, error: 'Button URL is invalid or potentially unsafe' };
  }
  
  return { isValid: true };
};