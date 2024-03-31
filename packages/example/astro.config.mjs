import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { inhalt } from "@inhalt/astro";
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind(), inhalt({
    url: "http://localhost:3000",
    sections: "src/sections",
  })]
});