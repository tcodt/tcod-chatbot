/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        vazir: ["Vazir", "sans-serif"],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 10px rgba(79, 70, 229, 0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(79, 70, 229, 0.8)" },
        },
        accordionSlide: {
          "0%": { height: "0", opacity: "0" },
          "100%": { height: "auto", opacity: "1" },
        },
      },
      animation: {
        fadeIn: "fadeIn 1s ease-in",
        slideUp: "slideUp 0.5s ease-out",
        glow: "glow 2s ease-in-out infinite",
        accordionSlide: "accordionSlide 0.3s ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
