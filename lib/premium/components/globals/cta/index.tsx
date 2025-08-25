import React from 'react';
import Link from 'next/link';
import { CTAProps } from './types';

export type { CTAProps } from './types';

export const CTA: React.FC<CTAProps> = ({ headline, subheadline, primaryButton, secondaryButton }) => {
  return (
    <section role="region" aria-label="Call to action">
      {headline && <h2>{headline}</h2>}
      {subheadline && <p>{subheadline}</p>}
      <div>
        {primaryButton && (
          <Link href={primaryButton.url}>
            {primaryButton.text}
          </Link>
        )}
        {secondaryButton && (
          <Link href={secondaryButton.url}>
            {secondaryButton.text}
          </Link>
        )}
      </div>
    </section>
  );
};