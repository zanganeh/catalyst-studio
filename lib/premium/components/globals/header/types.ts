export interface MenuItem {
  label: string;
  url: string;
}

export interface HeaderProps {
  logo: string;
  menuItems?: MenuItem[];
  ctaButton?: {
    text: string;
    url: string;
  };
  sticky?: boolean;
}