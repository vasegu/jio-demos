/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        jio: {
          purple: "#7B2D8E",
          dark: "#0a0a0f",
          card: "#111118",
          border: "#1e1e2e",
          text: "#e0e0e8",
          muted: "#6b6b80",
        },
        urgency: {
          critical: "#ef4444",
          high: "#f97316",
          medium: "#eab308",
          low: "#22c55e",
        },
      },
    },
  },
  plugins: [],
};
