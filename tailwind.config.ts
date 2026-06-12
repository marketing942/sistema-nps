import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "serif"],
        serif: ["var(--font-serif)", "serif"],
      },
      colors: {
        // CPPEM Concursos
        cppem: {
          green: "#00E63C",
          "green-dark": "#00803D",
          military: "#1A3D2B",
          black: "#0A0A0A",
          card: "#111111",
          border: "#1E1E1E",
          white: "#F5F5F5",
          gray: "#888888",
          gold: "#C9A84C",
        },
        // Colégio CPPEM
        colegio: {
          navy: "#0D1B3E",
          "navy-mid": "#162247",
          "navy-light": "#1E2F5E",
          gold: "#C9A227",
          "gold-light": "#E8C350",
          "gold-pale": "#F5E4A8",
          "gold-dark": "#A07B10",
          white: "#FFFFFF",
          "off-white": "#F8F5EE",
          cream: "#EDE8D8",
          muted: "#8A9BB8",
        },
        // Admin neutral
        ink: {
          950: "#0a0a0c",
          900: "#101015",
          800: "#16161d",
          700: "#1f1f29",
          600: "#2a2a36",
          500: "#3b3b4d",
          400: "#6b6b7f",
          300: "#a1a1b3",
          200: "#d4d4dd",
          100: "#ececf1",
          50: "#f7f7fa",
        },
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
