import { trpcServer } from "@hono/trpc-server";
import {
  msgUpdateComponents,
  msgUpdatePage,
  previewBuildStatusValidator,
  type RealtimeMessage,
} from "@inhalt/schema";
import { Prisma } from "@prisma/client";
import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { cors } from "hono/cors";
import { validator } from "hono/validator";
import type { WSContext } from "hono/ws";
import { z } from "zod";

import { getAccessToken } from "./github/auth";
import { triggerCloudBuild } from "./github/build";
import { prisma } from "./prisma";
import { componentsRouter } from "./routers/components";
import { pagesRouter } from "./routers/pages";
import { previewsRouter } from "./routers/previews";
import { projectsRouter } from "./routers/projects";
import { router } from "./trpc";

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

export function broadcastRealtimeMessage(
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

app.use("/*", cors());

const pushEventValidator = z.object({
  ref: z.string(),
  repository: z.object({
    id: z.number(),
    name: z.string(),
    full_name: z.string(),
    clone_url: z.string(),
  }),
  installation: z.object({
    id: z.number(),
  }),
});

app.post("/integration/github", async (context) => {
  const eventName = context.req.header("x-github-event");
  const body = await context.req.json();

  if (eventName !== "push") {
    return;
  }

  const res = pushEventValidator.safeParse(body);
  if (!res.success) {
    return Response.json(null, { status: 200 });
  }

  const event = res.data;
  const token = await getAccessToken("866924", event.installation.id);
  const cloneUrl = `https://x-access-token:${token}@${event.repository.clone_url.slice(8)}`;

  triggerCloudBuild(cloneUrl);

  return Response.json(null, { status: 201 });
});

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
          id: true,
          componentName: true,
          props: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  return Response.json(page, { status: page ? 200 : 404 });
});

app.patch(
  "/page/:slug",
  validator("json", (value) => {
    const result = msgUpdatePage.safeParse(value);

    if (!result.success) {
      return Response.json(result.error, { status: 400 });
    }

    return {
      body: result.data,
    };
  }),
  async (context) => {
    const { body: msg } = context.req.valid("json");

    // Currently only a single update is supported
    const update = msg.updates.at(0);

    if (!update) {
      return Response.json(null, { status: 400 });
    }

    await prisma.$transaction([
      prisma.section.updateMany({
        where: {
          pageId: msg.pageId,
          order: {
            gte: update.order,
          },
        },
        data: {
          order:
            update.operation === "add"
              ? {
                  increment: 1,
                }
              : update.operation === "remove"
                ? {
                    decrement: 1,
                  }
                : undefined,
        },
      }),
      prisma.section.create({
        data: {
          pageId: msg.pageId,
          componentName: update.componentName,
          order: update.order,
          props: (update.props as any) ?? Prisma.DbNull,
        },
      }),
    ]);

    broadcastRealtimeMessage(
      {
        kind: "hmr:reload",
      },
      {
        target: "server",
      }
    );

    return Response.json(null, { status: 201 });
  }
);

app.get("/components", async (context) => {
  // const components = await prisma.component.findMany({
  //   select: {
  //     name: true,
  //     propsSchema: true,
  //   },
  // });

  return Response.json([]);
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
    // const { body: msg } = context.req.valid("json");
    // const existingComponents = await prisma.component.findMany();
    // const newComponents = msg.components.filter(
    //   (c) => !existingComponents.some((ec) => ec.name === c.name)
    // );
    // await prisma.$transaction([
    //   prisma.component.createMany({
    //     data: newComponents.map((c) => ({
    //       name: c.name,
    //       propsSchema: c.propsSchema ?? Prisma.DbNull,
    //     })),
    //   }),
    // ]);
    // Notify all clients
    // broadcastRealtimeMessage(msg);
    // return Response.json(null, { status: 201 });
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
      onClose: () => {
        webSocketConnections.delete(connectionId);
      },
    };
  })
);

export const appRouter = router({
  components: componentsRouter,
  pages: pagesRouter,
  projects: projectsRouter,
  previewBuilds: previewsRouter,
});

export type AppRouter = typeof appRouter;

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
  })
);

const patchPreviewBuildValidator = z.object({
  status: previewBuildStatusValidator,
});

app.patch(
  "/builds/:buildId",
  validator("json", (value) => patchPreviewBuildValidator.parse(value)),
  async (ctx) => {
    const id = ctx.req.param("buildId");
    const { status } = ctx.req.valid("json");

    await prisma.previewBuild.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }
);

Bun.serve({
  fetch: app.fetch,
  websocket,
});
