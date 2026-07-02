import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        hakuou: {
          ink: "#142334",
          muted: "#60758d",
          line: "#d8e2ea",
          blue: "#0b63ce",
          navy: "#123f73",
          mint: "#0f9f83",
          amber: "#c58a17",
          red: "#b42318"
        }
      },
      boxShadow: {
        panel: "0 14px 34px rgba(22, 36, 43, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
