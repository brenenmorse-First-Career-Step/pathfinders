import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        "career-blue": "#1E88E5",
        "career-blue-dark": "#1565C0",
        "career-blue-light": "#42A5F5",
        "step-green": "#43A047",
        "step-green-dark": "#2E7D32",
        "optimism-orange": "#FB8C00",
        "optimism-orange-dark": "#EF6C00",
        "soft-sky": "#E3F2FD",
        "charcoal": "#263238",
        "charcoal-light": "#37474F",
      },
      fontFamily: {
        poppins: ["var(--font-poppins)", "Arial", "Helvetica", "sans-serif"],
        inter: ["var(--font-inter)", "Arial", "Helvetica", "sans-serif"],
      },
      borderRadius: {
        "xl": "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        "soft": "0 4px 20px rgba(0, 0, 0, 0.08)",
        "card": "0 2px 12px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};

export default config;

