/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB", // Enterprise Cobalt
          hover: "#1D4ED8",   // Royal Navy
          accent: "#3B82F6",  // Radiant Blue
          tint: "#EFF6FF",    // Ice Blue
          deep: "#004AC6",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          canvas: "#FFFFFF",
          base: "#F7F9FB",
          muted: "#F1F5F9",
          subtle: "#ECEEF0",
        },
        ink: {
          primary: "#0F172A",
          secondary: "#334155",
          muted: "#64748B",
          placeholder: "#94A3B8",
        },
        border: {
          subtle: "#E2E8F0",
          strong: "#CBD5E1",
          focus: "#93C5FD",
        },
      },
      fontFamily: {
        heading: ["Hanken Grotesk", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        body: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
        floating: "0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.03)",
        modal: "0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
};
