import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from 'astro/config';
import EventEmitter from "events";
import { readdir, writeFile } from "fs/promises";
import { join } from "path";

const emitter = new EventEmitter();
const config = {
  url: "localhost:3000",
  sections: "src/sections"
}

function connect(server) {
  const ws = new WebSocket(`ws://${config.url}/realtime?kind=server`);

  ws.onopen = () => {
    console.log("Connected");

    emitter.on("send", (data) => {
      ws.send(JSON.stringify(data))
    })
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

  // Return the component names
  return components.map(c => c.name)
}



// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind(), {
    name: "inhalt",
    hooks: {
      "astro:config:setup": async () => {
        const componentNames = await rebuildComponentsFile()
        const msg = {
          kind: "components:update",
          components: componentNames.map(name => ({
            name,
            propsSchema: null
          }))
        }

        await fetch(`http://${config.url}/components`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(msg)
        })
      },
      "astro:server:setup": ({ server }) => {
        // Watch for changes in the sections folder
        const onWatchAddOrUnlink = async (file) => {
          if (file.includes(config.sections)) {
            const componentNames = await rebuildComponentsFile()
            emitter.emit("send", {
              kind: "components:update", components: componentNames.map(name => ({
                name,
                propsSchema: null
              }))
            })
          }
        }

        server.watcher.on("add", onWatchAddOrUnlink)
        server.watcher.on("unlink", onWatchAddOrUnlink)
        server.watcher.add(config.sections)

        // Connect to CMS
        connect(server)
      },
    }
  }]
});