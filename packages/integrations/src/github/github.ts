import { getComponents } from "../common/components";
import { getConfig } from "../common/config";

async function onPush() {
  const config = await getConfig();
  const components = await getComponents(config);
}
