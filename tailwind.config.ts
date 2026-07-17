import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        muted: "#667085",
        line: "#D8E0E7",
        canvas: "#F3F7F4",
        panel: "#FFFFFF",
        brand: "#0E9384",
        success: "#12B76A",
        danger: "#F04438",
        warning: "#F79009"
      },
      boxShadow: {
        soft: "0 18px 48px rgba(16, 24, 40, 0.12)",
        lift: "0 10px 28px rgba(16, 24, 40, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
