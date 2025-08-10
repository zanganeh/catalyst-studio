import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Catalyst X Brand Colors - Enhanced Design System
        catalyst: {
          orange: "#FF5500",
          "orange-hover": "#ff6622",
          "orange-light": "rgba(255, 85, 0, 0.1)",
          black: "#212121",
          blue: "#0077CC",
          "blue-hover": "#0088dd",
          "blue-light": "rgba(0, 119, 204, 0.1)",
          green: "#00AA55",
          "green-hover": "#00bb66",
          "green-light": "rgba(0, 170, 85, 0.1)",
          red: "#DC2626",
          "red-hover": "#ef4444",
          "red-light": "rgba(220, 38, 38, 0.1)",
        },
        // Surface colors for glass morphism
        "surface-dark": "rgba(255, 255, 255, 0.05)",
        "surface-darker": "rgba(255, 255, 255, 0.03)",
        "surface-light": "rgba(255, 255, 255, 0.08)",
        // Dark backgrounds
        "dark-primary": "#0a0a0a",
        "dark-secondary": "#1a1a1a",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        glass: "10px",
        lg: "12px",
        xl: "16px",
      },
      transitionTimingFunction: {
        "catalyst": "cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;