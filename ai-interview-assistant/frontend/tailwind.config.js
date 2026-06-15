/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.05)",
        "card-hover": "0 2px 4px rgba(0,0,0,0.04), 0 16px 32px rgba(0,0,0,0.10)",
        sidebar: "1px 0 0 0 #f1f5f9",
        auth: "0 8px 40px rgba(0,0,0,0.10)",
      },
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
      backgroundImage: {
        "sidebar-brand": "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        "auth-panel": "linear-gradient(145deg, #3730a3 0%, #4f46e5 45%, #7c3aed 100%)",
      },
    },
  },
  plugins: [],
};
