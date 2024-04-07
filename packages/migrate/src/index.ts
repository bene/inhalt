#! /usr/bin/env bun

import { getComponents } from "@inhalt/internal";

import { loadMigrateConfig, loadPluginConfig } from "./config";
import { trpc } from "./trpc";

// Load migrate config
const migrateConfig = await loadMigrateConfig();

// Load astro plugin config
const pluginConfig = await loadPluginConfig(migrateConfig);

// Parse components
const components = await getComponents(pluginConfig, migrateConfig.rootDir);

// Send components to API
try {
  const res = await trpc.components.update.mutate({ components });
} catch (error: unknown) {
  console.error(error);
  process.exit(1);
}

// Done
console.log("✨ CMS components updated");
