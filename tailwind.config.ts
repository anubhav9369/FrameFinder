import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          DEFAULT: "#FF6B4A",
          soft: "#FF8A66",
          deep: "#E5532F",
          muted: "rgba(255, 107, 74, 0.12)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
