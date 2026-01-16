import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Monaco", "Menlo", "monospace"]
      },
      colors: {
        background: "#050816",
        foreground: "#F9FAFB",
        muted: {
          DEFAULT: "#111827",
          foreground: "#9CA3AF"
        },
        border: "#1F2937",
        accent: {
          DEFAULT: "#6366F1",
          foreground: "#E5E7EB"
        }
      }
    }
  },
  plugins: []
};

export default config;

