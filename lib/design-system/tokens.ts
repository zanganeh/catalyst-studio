/**
 * Catalyst X Design System Tokens
 * Centralized design tokens for consistent visual identity
 */

export const tokens = {
  colors: {
    background: {
      primary: '#0a0a0a',
      secondary: '#1a1a1a',
      surface: 'rgba(255, 255, 255, 0.05)',
      surfaceDark: 'rgba(255, 255, 255, 0.03)',
      overlay: 'rgba(0, 0, 0, 0.8)'
    },
    text: {
      primary: '#ffffff',
      secondary: '#9ca3af',
      muted: '#6b7280',
      disabled: '#4b5563'
    },
    accent: {
      orange: '#FF5500',
      orangeHover: '#ff6622',
      orangeLight: 'rgba(255, 85, 0, 0.1)',
      blue: '#0077CC',
      blueHover: '#0088dd',
      blueLight: 'rgba(0, 119, 204, 0.1)',
      green: '#00AA55',
      greenHover: '#00bb66',
      greenLight: 'rgba(0, 170, 85, 0.1)',
      red: '#DC2626',
      redHover: '#ef4444',
      redLight: 'rgba(220, 38, 38, 0.1)'
    },
    border: {
      default: 'rgba(255, 255, 255, 0.1)',
      hover: 'rgba(255, 255, 255, 0.15)',
      active: '#FF5500'
    }
  },
  effects: {
    blur: 'blur(10px)',
    glass: 'backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.05);',
    glassDark: 'backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.03);'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px'
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontWeights: {
      light: 200,
      normal: 400,
      medium: 500,
      bold: 700
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    }
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px rgba(0, 0, 0, 0.5)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.5)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
  },
  borders: {
    radius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px'
    },
    width: {
      thin: '1px',
      medium: '2px',
      thick: '3px'
    }
  },
  transitions: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms'
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  }
}

// Export CSS variables for use in global styles
export function getCSSVariables() {
  return `
    :root {
      /* Colors */
      --color-bg-primary: ${tokens.colors.background.primary};
      --color-bg-secondary: ${tokens.colors.background.secondary};
      --color-bg-surface: ${tokens.colors.background.surface};
      --color-bg-surface-dark: ${tokens.colors.background.surfaceDark};
      --color-bg-overlay: ${tokens.colors.background.overlay};
      
      --color-text-primary: ${tokens.colors.text.primary};
      --color-text-secondary: ${tokens.colors.text.secondary};
      --color-text-muted: ${tokens.colors.text.muted};
      --color-text-disabled: ${tokens.colors.text.disabled};
      
      --color-accent-orange: ${tokens.colors.accent.orange};
      --color-accent-orange-hover: ${tokens.colors.accent.orangeHover};
      --color-accent-orange-light: ${tokens.colors.accent.orangeLight};
      --color-accent-blue: ${tokens.colors.accent.blue};
      --color-accent-blue-hover: ${tokens.colors.accent.blueHover};
      --color-accent-blue-light: ${tokens.colors.accent.blueLight};
      --color-accent-green: ${tokens.colors.accent.green};
      --color-accent-green-hover: ${tokens.colors.accent.greenHover};
      --color-accent-green-light: ${tokens.colors.accent.greenLight};
      --color-accent-red: ${tokens.colors.accent.red};
      --color-accent-red-hover: ${tokens.colors.accent.redHover};
      --color-accent-red-light: ${tokens.colors.accent.redLight};
      
      --color-border-default: ${tokens.colors.border.default};
      --color-border-hover: ${tokens.colors.border.hover};
      --color-border-active: ${tokens.colors.border.active};
      
      /* Typography */
      --font-family: ${tokens.typography.fontFamily};
      --font-weight-light: ${tokens.typography.fontWeights.light};
      --font-weight-normal: ${tokens.typography.fontWeights.normal};
      --font-weight-medium: ${tokens.typography.fontWeights.medium};
      --font-weight-bold: ${tokens.typography.fontWeights.bold};
      
      /* Transitions */
      --transition-fast: ${tokens.transitions.duration.fast};
      --transition-normal: ${tokens.transitions.duration.normal};
      --transition-slow: ${tokens.transitions.duration.slow};
      --ease-in-out: ${tokens.transitions.easing.easeInOut};
    }
  `;
}