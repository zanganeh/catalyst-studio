import React from 'react';
import { HeaderProps } from './types';

export const Header: React.FC<HeaderProps> = ({ logo, menuItems, ctaButton, sticky }) => {
  return (
    <header className={`header-section ${sticky ? 'sticky' : ''}`}>
      <div className="logo">{logo}</div>
      {menuItems && menuItems.length > 0 && (
        <nav>
          <ul>
            {menuItems.map((item, index) => (
              <li key={index}>
                <a href={item.url}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {ctaButton && (
        <a href={ctaButton.url} className="cta-button">
          {ctaButton.text}
        </a>
      )}
    </header>
  );
};