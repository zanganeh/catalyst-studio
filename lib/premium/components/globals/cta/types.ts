export interface CTAButton {
  text: string;
  url: string;
}

export interface CTAProps {
  headline?: string;
  subheadline?: string;
  primaryButton?: CTAButton;
  secondaryButton?: CTAButton;
}