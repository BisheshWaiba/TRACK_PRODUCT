/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAF7F1",
        surface: "#FFFFFF",
        "surface-2": "#F1EBDD",
        border: "#E4DCC9",
        ink: "#1C1B19",
        "ink-soft": "#4A4642",
        muted: "#89826F",
        accent: {
          DEFAULT: "#E2672A",
          dark: "#C9591F",
          text: "#A6461C",
          ink: "#7A2E10",
          soft: "#FBE7D6",
        },
        teal: {
          DEFAULT: "#1E7A63",
          soft: "#DEEFE8",
        },
        slate: {
          DEFAULT: "#3A5BA0",
          soft: "#E4EAF6",
        },
        danger: {
          DEFAULT: "#B23A2E",
          soft: "#F6E1DD",
          dark: "#7A2A20",
        },
        sidebar: {
          DEFAULT: "#1C1B19",
          hover: "#2B2925",
          border: "#3A3730",
          text: "#C9C3B4",
          muted: "#8A8474",
        },
      },
      fontFamily: {
        display: ["'Bricolage Grotesque'", "sans-serif"],
        body: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        xl2: "14px",
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.3 },
        },
      },
      animation: {
        pulseDot: "pulseDot 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
