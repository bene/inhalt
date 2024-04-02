import { generateComponentsFile, getComponents } from "@inhalt/internal";
import { configValidator, type Config, type ConfigInput } from "@inhalt/schema";
import type { AstroIntegration } from "astro";
import EventEmitter from "events";
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

export function createAstroPlugin(configInput: ConfigInput): AstroIntegration {
  const config = configValidator.parse(configInput);

  return {
    name: "@inhalt/astro",
    hooks: {
      "astro:config:setup": async ({
        config: astroConfig,
        injectScript,
        injectRoute,
        command,
      }) => {
        await getComponents(config, astroConfig.root.pathname);
        await generateComponentsFile(
          config,
          astroConfig.root.pathname,
          __dirname
        );

        // Inject the page renderer route
        injectRoute({
          pattern: "[...slug]",
          entrypoint: join(import.meta.dirname, "..", "PageRenderer.astro"),
        });

        // Inject messaging script when in dev mode
        if (command === "dev") {
          const build = await Bun.build({
            entrypoints: [join(import.meta.dirname, "inject.ts")],
            minify: true,
            plugins: [],
            target: "browser",
          });
          const raw = build.outputs.at(0)!;
          const code = await raw.text();

          injectScript("page", code);
        }
      },
      "astro:server:setup": ({ server }) => {
        connect(config, server);
      },
    },
  };
}
