import { configValidator } from "@inhalt/schema";
import { readFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";

const migrateConfigValidator = z.object({
  rootDir: z.string(),
});
type MigrateConfig = z.infer<typeof migrateConfigValidator>;

export async function loadPluginConfig(migrateConfig: MigrateConfig) {
  const raw = await readFile(
    join(migrateConfig.rootDir, "pluginConfig.json"),
    "utf-8"
  );
  const pluginConfig = configValidator.parse(raw);

  return pluginConfig;
}

export async function loadMigrateConfig() {
  const rootDir = import.meta.env.INHALT_ROOT_DIR ?? ".";

  const config = migrateConfigValidator.parse({
    rootDir,
  });

  return config;
}
