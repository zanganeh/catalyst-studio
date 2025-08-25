import React from 'react';
import Link from 'next/link';
import { HeaderProps } from './types';

export type { HeaderProps } from './types';

export const Header: React.FC<HeaderProps> = ({ logo, menuItems, ctaButton, sticky }) => {
  return (
    <header role="banner" style={sticky ? { position: 'sticky', top: 0, zIndex: 50 } : undefined}>
      <div>{logo}</div>
      {menuItems && menuItems.length > 0 && (
        <nav role="navigation" aria-label="Main navigation">
          <ul>
            {menuItems.map((item) => (
              <li key={`nav-${item.label}-${item.url}`}>
                <Link href={item.url}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {ctaButton && (
        <Link href={ctaButton.url}>
          {ctaButton.text}
        </Link>
      )}
    </header>
  );
};