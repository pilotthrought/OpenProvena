/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif:  ["'Playfair Display'", "Georgia", "serif"],
        sans:   ["'DM Sans'", "system-ui", "sans-serif"],
        mono:   ["'DM Mono'", "monospace"],
      },
      colors: {
        ink:       "#1a1a1a",
        "off-white": "#f5f4f0",
        rule:      "#d4d0c8",
        muted:     "#6b6b6b",
        "trust-high":   "#2d6a4f",
        "trust-mid":    "#b5832a",
        "trust-low":    "#c0392b",
        "trust-critical": "#7b1f1f",
        "score-bar":    "#e8e4dc",
      },
      borderWidth: { "0.5": "0.5px" },
      spacing:     { "18": "4.5rem" },
    },
  },
  plugins: [],
};
