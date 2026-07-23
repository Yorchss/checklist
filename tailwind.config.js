/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1D4E89", dark: "#123C6B", light: "#EAF1F8" },
        bueno: { DEFAULT: "#2E8B57", light: "#E4F3EA" },
        regular: { DEFAULT: "#D98E04", light: "#FBF0DC" },
        malo: { DEFAULT: "#C1443C", light: "#FBE7E5" },
        ink: "#14202B",
        muted: "#5B6B7A",
        surface: "#FFFFFF",
        bg: "#F7F9FB",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
