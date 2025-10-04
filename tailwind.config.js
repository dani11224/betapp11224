/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  darkMode: ["class"],
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./contexts/**/*.{js,jsx,ts,tsx}",
    "./utils/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: { lg: 16, md: 12, sm: 8 },
      colors: {
        // 🔧 Tokens tipo shadcn mapeados a valores reales para RN
        background: "#0B1220",
        foreground: "#E6EDF3",
        card: "#0F1725",
        "card-foreground": "#E6EDF3",
        popover: "#0F1725",
        "popover-foreground": "#E6EDF3",

        primary: { DEFAULT: "#1D4ED8", foreground: "#FFFFFF" },
        secondary: { DEFAULT: "#334155", foreground: "#FFFFFF" },
        accent: { DEFAULT: "#7C3AED", foreground: "#FFFFFF" },
        muted: { DEFAULT: "#8A95A3", foreground: "#C7D0DB" },
        destructive: { DEFAULT: "#EF4444", foreground: "#FFFFFF" },

        border: "#1F2733",
        input: "#16202B",
        ring: "#38BDF8",
      },
    },
  },
  plugins: [], // evita plugins web en RN
};
