import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      onMessage(event, ws) {
        console.log(`Message from client: ${event.data}`);
        ws.send("Hello from server!");
      },
      onClose: () => {
        console.log("Connection closed");
      },
    };
  })
);

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
