import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        jc: {
          navy: "#0f2747",
          blue: "#1d72d8",
          sky: "#eaf4ff",
          line: "#d8e3f0"
        }
      },
      boxShadow: {
        soft: "0 12px 30px rgba(15, 39, 71, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
