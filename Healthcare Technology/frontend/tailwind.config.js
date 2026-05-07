/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          blue: "#00f3ff",
          pink: "#ff00ff",
          black: "#050505",
          gray: "#0d0d0d",
          yellow: "#bcff00",
        },
      },
      fontFamily: {
        orbitron: ["var(--font-orbitron)"],
        rajdhani: ["var(--font-rajdhani)"],
      },
      animation: {
        glitch: "glitch 1s linear infinite",
        scanline: "scanline 10s linear infinite",
      },
      keyframes: {
        glitch: {
          "0%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
          "100%": { transform: "translate(0)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
};
