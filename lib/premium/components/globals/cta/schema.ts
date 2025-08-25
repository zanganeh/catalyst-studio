import { CTAProps } from './types';
import { isValidUrl } from '@/lib/premium/utils/url-validator';

export const ctaSchema = {
  name: 'Call to Action',
  description: 'Call-to-action section with buttons',
  properties: {
    headline: { type: 'string', required: false },
    subheadline: { type: 'string', required: false },
    primaryButton: { type: 'object', required: false },
    secondaryButton: { type: 'object', required: false }
  }
};

export type ValidationResult = { isValid: boolean; error?: string };

export const validateCTA = (props: Partial<CTAProps>): ValidationResult => {
  // Validate primary button
  if (props.primaryButton) {
    if (!props.primaryButton.text || props.primaryButton.text.trim().length === 0) {
      return { isValid: false, error: 'Primary button text is required when button is present' };
    }
    if (props.primaryButton.url && !isValidUrl(props.primaryButton.url)) {
      return { isValid: false, error: 'Primary button URL is invalid or potentially unsafe' };
    }
  }
  
  // Validate secondary button
  if (props.secondaryButton) {
    if (!props.secondaryButton.text || props.secondaryButton.text.trim().length === 0) {
      return { isValid: false, error: 'Secondary button text is required when button is present' };
    }
    if (props.secondaryButton.url && !isValidUrl(props.secondaryButton.url)) {
      return { isValid: false, error: 'Secondary button URL is invalid or potentially unsafe' };
    }
  }
  
  return { isValid: true };
};