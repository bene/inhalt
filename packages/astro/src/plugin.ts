import { generateComponentsFile, getComponents } from "@inhalt/internal";
import { configValidator, type Config, type ConfigInput } from "@inhalt/schema";
import type { AstroIntegration } from "astro";
import EventEmitter from "events";
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

export function createAstroPlugin(configInput: ConfigInput): AstroIntegration {
  const config = configValidator.parse(configInput);

  return {
    name: "@inhalt/astro",
    hooks: {
      "astro:config:setup": async ({ config: astroConfig }) => {
        await getComponents(config, astroConfig.root.pathname);
        const names = await generateComponentsFile(
          config,
          astroConfig.root.pathname,
          __dirname
        );

        const msg = {
          kind: "components:update",
          components: names.map((name) => ({
            name,
            propsSchema: null,
          })),
        };

        const res = await fetch(`${config.url}components`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(msg),
        });
      },
      "astro:server:setup": ({ server }) => {
        connect(config, server);
      },
    },
  };
}
