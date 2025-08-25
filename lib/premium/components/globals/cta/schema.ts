import { CTAProps } from './types';

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
  if (props.primaryButton && (!props.primaryButton.text || props.primaryButton.text.trim().length === 0)) {
    return { isValid: false, error: 'Primary button text is required when button is present' };
  }
  if (props.secondaryButton && (!props.secondaryButton.text || props.secondaryButton.text.trim().length === 0)) {
    return { isValid: false, error: 'Secondary button text is required when button is present' };
  }
  return { isValid: true };
};