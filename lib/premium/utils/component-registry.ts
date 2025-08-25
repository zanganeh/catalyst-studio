import { Hero } from '../components/globals/hero';
import { heroSchema, validateHero, ValidationResult } from '../components/globals/hero/schema';
import { heroDefaults } from '../components/globals/hero/defaults';

import { Header } from '../components/globals/header';
import { headerSchema, validateHeader } from '../components/globals/header/schema';
import { headerDefaults } from '../components/globals/header/defaults';

import { Footer } from '../components/globals/footer';
import { footerSchema, validateFooter } from '../components/globals/footer/schema';
import { footerDefaults } from '../components/globals/footer/defaults';

import { CTA } from '../components/globals/cta';
import { ctaSchema, validateCTA } from '../components/globals/cta/schema';
import { ctaDefaults } from '../components/globals/cta/defaults';

export type { ValidationResult };

export const COMPONENT_REGISTRY = {
  hero: {
    component: Hero,
    schema: heroSchema,
    defaults: heroDefaults,
    validate: validateHero
  },
  header: {
    component: Header,
    schema: headerSchema,
    defaults: headerDefaults,
    validate: validateHeader
  },
  footer: {
    component: Footer,
    schema: footerSchema,
    defaults: footerDefaults,
    validate: validateFooter
  },
  cta: {
    component: CTA,
    schema: ctaSchema,
    defaults: ctaDefaults,
    validate: validateCTA
  }
};

export type ComponentType = keyof typeof COMPONENT_REGISTRY;