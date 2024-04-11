#! /usr/bin/env bun

import { getComponents } from "@inhalt/internal";

import { loadPluginConfig } from "./config";
import { trpc } from "./trpc";

// Load astro plugin config
const pluginConfig = await loadPluginConfig();

// Parse components
const components = await getComponents(pluginConfig);

// Send components to API
try {
  await trpc.previews.builds.update.mutate({
    buildId: import.meta.env.INHALT_PREVIEW_BUILD_ID!,
    components,
  });
} catch (error: unknown) {
  console.error(error);
  process.exit(1);
}

// Done
console.log("✨ CMS components updated");
