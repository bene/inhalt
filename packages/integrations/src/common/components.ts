import type {
  Component,
  Config,
  UpdateComponentsMessage,
} from "@inhalt/schema";
import { readdir } from "fs/promises";
import { join } from "path";

export async function getComponents(config: Config) {
  const files = await readdir(config.sections);
  const components = files.map((file) => {
    const componentName = file.split(".astro")[0];

    return {
      name: componentName,
      path: join(__dirname, config.sections, file),
    };
  });

  return components;
}

export async function updateComponents({
  config,
  components,
}: {
  config: Config;
  components: Array<Component>;
}) {
  const res = await fetch(config.url, {
    method: "PUT",
    body: JSON.stringify({
      kind: "components:update",
      components,
    } satisfies UpdateComponentsMessage),
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log(res.status);
}
