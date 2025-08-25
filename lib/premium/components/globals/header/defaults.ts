import { HeaderProps } from './types';

export const headerDefaults: HeaderProps = {
  logo: 'Company',
  menuItems: [
    { label: 'Home', url: '/' },
    { label: 'About', url: '/about' },
    { label: 'Contact', url: '/contact' }
  ],
  sticky: false
};