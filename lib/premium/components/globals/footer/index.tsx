import React from 'react';
import Link from 'next/link';
import { FooterProps } from './types';

export type { FooterProps } from './types';

export const Footer: React.FC<FooterProps> = ({ copyright, columns, socialLinks }) => {
  return (
    <footer role="contentinfo">
      {columns && columns.length > 0 && (
        <div>
          {columns.map((column) => (
            <div key={`footer-col-${column.title}`}>
              <h3>{column.title}</h3>
              <ul>
                {column.links.map((link) => (
                  <li key={`footer-link-${link.label}-${link.url}`}>
                    <Link href={link.url}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {socialLinks && socialLinks.length > 0 && (
        <div>
          {socialLinks.map((social) => (
            <Link 
              key={`social-${social.platform}-${social.url}`} 
              href={social.url} 
              aria-label={`Visit our ${social.platform}`}
            >
              {social.platform}
            </Link>
          ))}
        </div>
      )}
      {copyright && <div>{copyright}</div>}
    </footer>
  );
};