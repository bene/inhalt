import { configValidator } from "@inhalt/schema";
import { readFile } from "fs/promises";
import { join } from "path";

export async function loadPluginConfig() {
  const raw = await readFile(join(__dirname, "pluginConfig.json"), "utf-8");
  const pluginConfig = configValidator.parse(JSON.parse(raw));

  return pluginConfig;
}
