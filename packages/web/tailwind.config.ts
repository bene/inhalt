import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      container: {
        center: true,
      },
    },
  },
  plugins: [forms],
} satisfies Config;
