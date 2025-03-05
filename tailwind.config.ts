import type { Config } from "tailwindcss";
const defaultTheme = require("tailwindcss/defaultTheme");
const config: Config = {
  important: true,
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors : {
        nrvDarkBlue: "#234e87",
        nrvGold: "#FFB94E",
        nrvGreyBlack: "#333333",
        nrvGrayText:'#7d7d7d',
        nrvLightGrey: "#999999",
        nrvLightGreyBg:"#EEF0F2", 
        nrvLightBlue: "#6c8ebd",
        nrvGreyMediumBg: "#d7d9db",
        nrvInputFiledColor: "#807F94"

      }
    },
  },
  plugins: [],
};
export default config;
