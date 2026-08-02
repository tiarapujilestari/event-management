/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff1f0",
          100: "#ffe0dc",
          200: "#ffc2ba",
          300: "#ff9a8a",
          400: "#ff6a52",
          500: "#f13a1f", // primary
          600: "#d92c14",
          700: "#b32210",
          800: "#8f1d10",
          900: "#761d13",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        floatUp: {
          "0%": { transform: "translateY(12px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        fadeIn: "fadeIn .4s ease-out",
        floatUp: "floatUp .5s ease-out",
        marquee: "marquee 22s linear infinite",
      },
    },
  },
  plugins: [],
};
