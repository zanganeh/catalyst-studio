import React from 'react';
import { FooterProps } from './types';

export const Footer: React.FC<FooterProps> = ({ copyright, columns, socialLinks }) => {
  return (
    <footer className="footer-section">
      {columns && columns.length > 0 && (
        <div className="footer-columns">
          {columns.map((column, index) => (
            <div key={index} className="footer-column">
              <h3>{column.title}</h3>
              <ul>
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a href={link.url}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {socialLinks && socialLinks.length > 0 && (
        <div className="social-links">
          {socialLinks.map((social, index) => (
            <a key={index} href={social.url} aria-label={social.platform}>
              {social.platform}
            </a>
          ))}
        </div>
      )}
      {copyright && <div className="copyright">{copyright}</div>}
    </footer>
  );
};