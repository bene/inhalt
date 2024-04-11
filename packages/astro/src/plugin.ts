import { generateComponentsFile, getComponents } from "@inhalt/internal";
import { configValidator, type Config, type ConfigInput } from "@inhalt/schema";
import type { AstroIntegration } from "astro";
import EventEmitter from "events";
import { writeFileSync } from "fs";
import { join } from "path";
import type { ViteDevServer } from "vite";
import { z } from "zod";

const inhaltEnvValidator = z
  .union([z.literal("build_preview"), z.literal("preview")])
  .optional();

const emitter = new EventEmitter();
const env = inhaltEnvValidator.parse(import.meta.env.INHALT_ENV);

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

  if (env === "build_preview") {
    writeFileSync("pluginConfig.json", JSON.stringify(config), "utf-8");
    process.exit(0);
  }

  return {
    name: "@inhalt/astro",
    hooks: {
      "astro:config:setup": async ({
        config: astroConfig,
        injectScript,
        injectRoute,
        updateConfig,
      }) => {
        updateConfig({
          resolvedInjectedRoutes: [],
        } as any);
        await getComponents(config);
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
        if (env === "preview") {
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
