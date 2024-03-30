import react from "@astrojs/react";
import { defineConfig } from 'astro/config';

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind(), {
    name: "inhalt",
    hooks: {
      "astro:server:setup": ({ server }) => {
        // setInterval(() => {
        //   server.hot.send({
        //     type: 'full-reload',
        //     path: './src/pages/[...slug].astro'
        //   });
        //   console.log("Test")
        // }, 1000)
      }
    }
  }]
});