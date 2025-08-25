import { HeroProps } from './types';

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

export const validateHero = (props: Partial<HeroProps>): boolean => {
  return !!props.title && props.title.trim().length > 0;
};