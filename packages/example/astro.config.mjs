import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from 'astro/config';
import { readdir, writeFile } from "fs/promises";
import { join } from "path";

function connect(server) {
  const ws = new WebSocket("ws://localhost:3000/ws?kind=hmr");

  ws.onopen = () => {
    console.log("Connected");
  };

  ws.onmessage = () => {
    console.log("reload")

    server.hot.send({
      type: 'full-reload',
      path: './src/pages/[...slug].astro'
    });
  };

  ws.onerror = (error) => {
    console.log(`[Inhalt] Error: ${error.message}`);
  };

  ws.onclose = () => {
    console.log("[Inhalt] Connection to CMS closed")
    setTimeout(() => connect(server), 1000)
  };
}

async function rebuildComponentsFile() {
  const files = await readdir(config.sections)
  const components = files.map((file) => {
    const componentName = file.split(".astro")[0]

    return {
      name: componentName,
      path: join(__dirname, config.sections, file)
    }
  })

  let sectionsFileSource = components.map(c => `import ${c.name} from "${c.path}"`).join("\n")
  sectionsFileSource += `\n\nexport default {${components.map(c => c.name).join(", ")}}`

  // Save to node_modules/inhalt a la prisma client
  await writeFile("sections.gen.ts", sectionsFileSource)
}

const config = {
  url: "http://localhost:3000",
  sections: "src/sections"
}

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind(), {
    name: "inhalt",
    hooks: {
      "astro:config:setup": () => {
        rebuildComponentsFile()
      },
      "astro:server:setup": ({ server }) => {
        // Watch for changes in the sections folder
        const onWatchEvent = (file) => {
          if (file.includes(config.sections)) {
            rebuildComponentsFile()
          }
        }

        server.watcher.on("change", onWatchEvent)
        server.watcher.on("add", onWatchEvent)
        server.watcher.on("unlink", onWatchEvent)
        server.watcher.add(config.sections)

        // Connect to CMS
        connect(server)
      },
    }
  }]
});