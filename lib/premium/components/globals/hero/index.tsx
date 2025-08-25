import React from 'react';
import { HeroProps } from './types';

export const Hero: React.FC<HeroProps> = ({ title, subtitle, buttonText, buttonUrl }) => {
  return (
    <div className="hero-section">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {buttonText && (
        <a href={buttonUrl || '/signup'}>{buttonText}</a>
      )}
    </div>
  );
};