export default {
  darkMode: "class",   // 👈 ADD THIS LINE

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: "#6D5EF8",
        accent: "#4DA3FF",
        dark: "#0b0f19",
        card: "#111827",
      },
    },
  },

  plugins: [],
};