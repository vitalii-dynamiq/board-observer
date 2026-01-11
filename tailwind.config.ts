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
      fontFamily: {
        // IBM Plex - Enterprise geometric typeface
        sans: [
          "IBM Plex Sans",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "IBM Plex Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      colors: {
        // Refined gray scale - Vercel/Stripe aesthetic
        gray: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },
        // Single accent color - keep minimal
        accent: {
          DEFAULT: "#18181b",
          foreground: "#fafafa",
        },
        // Semantic colors
        background: "#fafafa",
        foreground: "#18181b",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#18181b",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#18181b",
        },
        primary: {
          DEFAULT: "#18181b",
          foreground: "#fafafa",
        },
        secondary: {
          DEFAULT: "#f4f4f5",
          foreground: "#18181b",
        },
        muted: {
          DEFAULT: "#f4f4f5",
          foreground: "#71717a",
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#fafafa",
        },
        border: "#e4e4e7",
        input: "#e4e4e7",
        ring: "#a1a1aa",
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
        xl: "12px",
        "2xl": "16px",
      },
      spacing: {
        // Enforce consistent spacing scale
        "4.5": "18px",
        "18": "72px",
        "22": "88px",
      },
      boxShadow: {
        // Depth system shadows
        "xs": "0 1px 2px 0 rgb(0 0 0 / 0.03)",
        "sm": "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "DEFAULT": "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        "md": "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        "lg": "0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
        "soft": "0 2px 8px -2px rgb(0 0 0 / 0.08)",
        "glow": "0 0 0 3px rgb(161 161 170 / 0.1)",
        "inner-sm": "inset 0 1px 2px rgb(0 0 0 / 0.04)",
        "card": "0 1px 3px 0 rgb(0 0 0 / 0.03), 0 1px 2px -1px rgb(0 0 0 / 0.03)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05), 0 10px 15px -3px rgb(0 0 0 / 0.03)",
      },
      transitionDuration: {
        DEFAULT: "150ms",
        "200": "200ms",
        "250": "250ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
        "smooth": "cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 300ms ease-out",
        "scale-in": "scale-in 200ms ease-out",
        "slide-up": "slide-up 300ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
