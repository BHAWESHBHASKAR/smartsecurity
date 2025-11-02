const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        serif: ["var(--font-lora)", ...fontFamily.serif],
      },
      colors: {
        primary: {
          dark: "#1e293b",
          DEFAULT: "hsl(var(--primary))",
          light: "#475569",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          blue: "#3b82f6",
          "blue-dark": "#2563eb",
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        status: {
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#06b6d4",
        },
        background: "hsl(var(--background))",
        surface: "#1e293b",
        border: "hsl(var(--border))",
        text: {
          primary: "#f1f5f9",
          secondary: "#cbd5e1",
        },
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      spacing: {
        xs: "0.5rem",
        sm: "0.75rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.5" }],
        sm: ["0.875rem", { lineHeight: "1.5" }],
        base: ["0.875rem", { lineHeight: "1.5" }],
        lg: ["1rem", { lineHeight: "1.5" }],
        xl: ["1.1rem", { lineHeight: "1.3" }],
        "2xl": ["1.25rem", { lineHeight: "1.3" }],
        "3xl": ["1.5rem", { lineHeight: "1.3" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      borderWidth: {
        DEFAULT: "1px",
        0: "0",
        2: "2px",
        4: "4px",
        8: "8px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
