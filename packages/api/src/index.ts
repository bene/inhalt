import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { WSContext } from "hono/ws";

const { upgradeWebSocket, websocket } = createBunWebSocket();
const app = new Hono();

type Connection = {
  kind: string;
  ws: WSContext;
};

const webSocketConnections = new Map<
  ReturnType<typeof crypto.randomUUID>,
  Connection
>();

app.get("/pages", (context) => {
  return Response.json([
    {
      id: "1",
      slug: "/",
      title: "Home",
    },
    {
      id: "2",
      slug: "about",
      title: "About",
    },
  ]);
});

app.get("/page/:slug", (context) => {
  const slug = context.req.param("slug");

  return Response.json({
    title: "First page",
    sections: [
      {
        componentName: "Title",
        props: {
          text: slug.toUpperCase(),
        },
      },
      {
        componentName: "Text2",
        props: {
          text: "Hello world!",
        },
      },
      {
        componentName: "Text3",
        props: {
          text: "Hello world!",
        },
      },
    ],
  });
});

app.get(
  "/ws",
  (context, next) => {
    const { searchParams } = new URL(context.req.url);
    const kind = searchParams.get("kind");
    if (!kind) {
      return new Response("", { status: 400 });
    }

    return next();
  },
  upgradeWebSocket((context) => {
    const connectionId = crypto.randomUUID();
    const { searchParams } = new URL(context.req.url);
    const kind = searchParams.get("kind")!;

    return {
      onOpen: (e, ws) => {
        webSocketConnections.set(connectionId, {
          kind,
          ws,
        });
      },
      onMessage: (event, ws) => {
        for (const connection of webSocketConnections.values()) {
          if (connection.ws !== ws) {
            connection.ws.send("Hello from server!");
          }
        }
      },
      onClose: () => {
        webSocketConnections.delete(connectionId);
      },
    };
  })
);

Bun.serve({
  fetch: app.fetch,
  websocket,
});
