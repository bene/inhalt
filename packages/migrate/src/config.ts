import { configValidator } from "@inhalt/schema";
import { readFile } from "fs/promises";

export async function loadPluginConfig() {
  const raw = await readFile("pluginConfig.json", "utf-8");
  const pluginConfig = configValidator.parse(JSON.parse(raw));

  return pluginConfig;
}
