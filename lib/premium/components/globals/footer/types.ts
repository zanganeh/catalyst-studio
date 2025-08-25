export interface FooterColumn {
  title: string;
  links: {
    label: string;
    url: string;
  }[];
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface FooterProps {
  copyright?: string;
  columns?: FooterColumn[];
  socialLinks?: SocialLink[];
}