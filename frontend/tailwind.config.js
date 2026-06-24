/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        glass: "rgba(255, 255, 255, 0.72)",
        "glass-border": "rgba(255, 255, 255, 0.65)",
      },
      boxShadow: {
        soft: "0 10px 24px rgba(16, 24, 40, 0.1)",
        card: "0 6px 14px rgba(16, 24, 40, 0.08)",
      },
    },
  },
  plugins: [],
};
