import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "#0f172a",
          50: "#f8fafc",
          800: "#1e293b",
          900: "#0b0f19",
          950: "#05070c",
        },
        cyber: {
          cyan: "#00f0ff",
          purple: "#9d4edd",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
        }
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
