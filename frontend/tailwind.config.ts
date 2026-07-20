import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          900: '#134e4a',
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  safelist: [
    'tabular-nums',
    'bg-green-100', 'text-green-700',
    'bg-blue-100', 'text-blue-700',
    'bg-amber-100', 'text-amber-700',
    'bg-red-100', 'text-red-700'
  ],
  plugins: [],
};
export default config;
