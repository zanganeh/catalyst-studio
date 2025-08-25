import React from 'react';
import Link from 'next/link';
import { HeroProps } from './types';

export type { HeroProps } from './types';

export const Hero: React.FC<HeroProps> = ({ title, subtitle, buttonText, buttonUrl }) => {
  return (
    <section>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {buttonText && (
        <Link href={buttonUrl || '/signup'}>
          {buttonText}
        </Link>
      )}
    </section>
  );
};