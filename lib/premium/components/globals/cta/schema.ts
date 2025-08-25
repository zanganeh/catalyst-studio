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

export const validateCTA = (props: Partial<CTAProps>): boolean => {
  if (props.primaryButton) {
    return !!props.primaryButton.text && props.primaryButton.text.trim().length > 0;
  }
  if (props.secondaryButton) {
    return !!props.secondaryButton.text && props.secondaryButton.text.trim().length > 0;
  }
  return true;
};