import {
  RealtimeMessage,
  msgUpdateComponents,
  realtimeMessage,
} from "@inhalt/schema";
import { Prisma } from "@prisma/client";
import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { validator } from "hono/validator";
import { WSContext } from "hono/ws";

import { prisma } from "./prisma";

const { upgradeWebSocket, websocket } = createBunWebSocket();
const app = new Hono();

type Connection = {
  kind: "client" | "server";
  ws: WSContext;
};

const webSocketConnections = new Map<
  ReturnType<typeof crypto.randomUUID>,
  Connection
>();

function broadcastRealtimeMessage(
  msg: RealtimeMessage,
  {
    target,
  }: {
    target: "client" | "server" | "all";
  } = {
    target: "all",
  }
) {
  for (const connection of Array.from(webSocketConnections.values()).filter(
    (c) => target === "all" || c.kind === target
  )) {
    connection.ws.send(JSON.stringify(msg));
  }
}

app.get("/pages", async (context) => {
  const pages = await prisma.page.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  return Response.json(pages);
});

app.get("/page/:slug", async (context) => {
  const slug = context.req.param("slug");
  const page = await prisma.page.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      slug: true,
      sections: {
        select: {
          componentName: true,
          props: true,
        },
      },
    },
  });

  return Response.json(page, { status: page ? 200 : 404 });
});

app.put(
  "/components",
  validator("json", (value) => {
    const result = msgUpdateComponents.safeParse(value);

    if (!result.success) {
      return Response.json(result.error, { status: 400 });
    }

    return {
      body: result.data,
    };
  }),
  async (context) => {
    const { body: msg } = context.req.valid("json");

    // TODO: Do proper diffing
    await prisma.$transaction([
      prisma.component.deleteMany(),
      prisma.component.createMany({
        data: msg.components.map((c) => ({
          name: c.name,
          propsSchema: c.propsSchema ?? Prisma.DbNull,
        })),
      }),
    ]);

    // Notify all clients
    broadcastRealtimeMessage(msg);

    return Response.json(null, { status: 201 });
  }
);

app.get(
  "/realtime",
  (context, next) => {
    const { searchParams } = new URL(context.req.url);
    const kind = searchParams.get("kind");
    if (!kind || (kind !== "client" && kind !== "server")) {
      console.log("Invalid kind");
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
          kind: kind as Connection["kind"],
          ws,
        });
      },
      onMessage: async (event, ws) => {
        const msg = realtimeMessage.parse(JSON.parse(event.data.toString()));

        if (msg.kind === "components:update") {
          // TODO: Do proper diffing
          await prisma.$transaction([
            prisma.component.deleteMany(),
            prisma.component.createMany({
              data: msg.components.map((c) => ({
                name: c.name,
                propsSchema: c.propsSchema ?? Prisma.DbNull,
              })),
            }),
          ]);

          // Notify all clients
          broadcastRealtimeMessage(msg);

          return;
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
