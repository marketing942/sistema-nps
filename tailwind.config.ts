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
        // Admin tokens — dynamic via CSS vars (light/dark)
        ink: {
          950: "rgb(var(--ink-950) / <alpha-value>)",
          900: "rgb(var(--ink-900) / <alpha-value>)",
          800: "rgb(var(--ink-800) / <alpha-value>)",
          700: "rgb(var(--ink-700) / <alpha-value>)",
          600: "rgb(var(--ink-600) / <alpha-value>)",
          500: "rgb(var(--ink-500) / <alpha-value>)",
          400: "rgb(var(--ink-400) / <alpha-value>)",
          300: "rgb(var(--ink-300) / <alpha-value>)",
          200: "rgb(var(--ink-200) / <alpha-value>)",
          100: "rgb(var(--ink-100) / <alpha-value>)",
          50: "rgb(var(--ink-50) / <alpha-value>)",
        },
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.6)",
        "card-light":
          "0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 2px rgba(15,15,25,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
