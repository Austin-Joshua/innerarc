/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./index.ts", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#F6F4F1",
        surface: "#EFECE8",
        ink: "#2C2A28",
        muted: "#6F6B66",
        accent: "#4A7C74",
        "accent-soft": "#D7E4E1",
        border: "#E0DCD6",
        success: "#5F7A68",
        "success-muted": "#E4EDE6",
        warning: "#B0894F",
        "warning-muted": "#F3ECDD",
        danger: "#8B3A3A",
        "danger-muted": "#F3E6E6",
        neutral: "#9A958F",
      },
      spacing: {
        xxs: 4,
        xs: 8,
        sm: 12,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 40,
      },
      borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
      },
      fontSize: {
        display: ["28px", { lineHeight: "34px", fontWeight: "600" }],
        heading: ["20px", { lineHeight: "26px", fontWeight: "600" }],
        body: ["16px", { lineHeight: "24px" }],
        caption: ["14px", { lineHeight: "20px" }],
        numeral: ["22px", { lineHeight: "28px", fontWeight: "700" }],
      },
    },
  },
  plugins: [],
};
