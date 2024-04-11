import type { AppRouter } from "@inhalt/api/src";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

import { loadPluginConfig } from "./config";

const pluginConfig = await loadPluginConfig();

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url:
        "https://6880-178-165-195-140.ngrok-free.app/trpc" ??
        `${pluginConfig.url}trpc`,
    }),
  ],
});
