import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { inhalt } from "@inhalt/astro";
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind(), inhalt({
    url: "https://6880-178-165-195-140.ngrok-free.app",
    sections: "src/sections",
  })]
});