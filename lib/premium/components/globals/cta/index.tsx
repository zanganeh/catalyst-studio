import React from 'react';
import { CTAProps } from './types';

export const CTA: React.FC<CTAProps> = ({ headline, subheadline, primaryButton, secondaryButton }) => {
  return (
    <div className="cta-section">
      {headline && <h2>{headline}</h2>}
      {subheadline && <p>{subheadline}</p>}
      <div className="cta-buttons">
        {primaryButton && (
          <a href={primaryButton.url} className="primary-button">
            {primaryButton.text}
          </a>
        )}
        {secondaryButton && (
          <a href={secondaryButton.url} className="secondary-button">
            {secondaryButton.text}
          </a>
        )}
      </div>
    </div>
  );
};