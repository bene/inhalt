import { configValidator, type Config, type ConfigInput } from "@inhalt/schema";
import type { AstroIntegration } from "astro";
import EventEmitter from "events";
import { readdir, writeFile } from "fs/promises";
import { join } from "path";
import type { ViteDevServer } from "vite";

const emitter = new EventEmitter();

function connect(config: Config, server: ViteDevServer) {
  const ws = new WebSocket(`${config.wsUrl}realtime?kind=server`);

  ws.onopen = () => {
    console.log("Connected");

    emitter.on("send", (data) => {
      ws.send(JSON.stringify(data));
    });
  };

  ws.onmessage = () => {
    console.log("reload");

    server.hot.send({
      type: "full-reload",
      path: "./src/pages/[...slug].astro",
    });
  };

  ws.onerror = (event) => {
    console.log(`[Inhalt] Error: ${event}`);
  };

  ws.onclose = () => {
    console.log("[Inhalt] Connection to CMS closed");
    setTimeout(() => connect(config, server), 1000);
  };
}

async function generateComponentsFile(config: Config, sectionsPath: string) {
  const files = await readdir(config.sections);
  const components = files.map((file) => {
    const componentName = file.split(".astro")[0];

    return {
      name: componentName,
      path: join(sectionsPath, file),
    };
  });

  let sectionsFileSource = components
    .map((c) => `import ${c.name} from "${c.path}"`)
    .join("\n");
  sectionsFileSource += `\n\nexport default {${components.map((c) => c.name).join(", ")}}`;

  // Save to node_modules/inhalt a la prisma client
  await writeFile(
    join(__dirname, "..", "gen", "sections.gen.ts"),
    sectionsFileSource
  );

  // Return the component names
  return components.map((c) => c.name);
}

export function createAstroPlugin(configInput: ConfigInput): AstroIntegration {
  const config = configValidator.parse(configInput);

  return {
    name: "@inhalt/astro",
    hooks: {
      "astro:config:setup": ({ config: astroConfig }) => {
        generateComponentsFile(
          config,
          join(astroConfig.root.pathname, config.sections)
        );
      },
      "astro:server:setup": ({ server }) => {
        connect(config, server);
      },
    },
  };
}
