/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./.storybook/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--ds-color-brand-primary-base, #0FA85E)",
        secondary: "var(--ds-color-brand-secondary-base, #0B6D53)",
        accent: "var(--ds-color-brand-accent-base, #F5B700)",
        surface: "var(--ds-color-neutral-50, #F8FAF9)",
        foreground: "var(--ds-color-neutral-900, #1E2A25)",
      },
      spacing: {
        "ds-xs": "var(--ds-spacing-xs, 4px)",
        "ds-sm": "var(--ds-spacing-sm, 8px)",
        "ds-md": "var(--ds-spacing-md, 12px)",
        "ds-lg": "var(--ds-spacing-lg, 16px)",
        "ds-xl": "var(--ds-spacing-xl, 24px)",
      },
      borderRadius: {
        "ds-sm": "var(--ds-radius-sm, 4px)",
        "ds-md": "var(--ds-radius-md, 8px)",
        "ds-lg": "var(--ds-radius-lg, 12px)",
      },
      fontFamily: {
        sans: [
          "var(--ds-typography-font-family)",
          "Noto Sans JP",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
