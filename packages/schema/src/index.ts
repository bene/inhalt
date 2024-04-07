import { z } from "zod";

export const configInputValidator = z.object({
  url: z.union([
    z.string().startsWith("http://"),
    z.string().startsWith("https://"),
  ]),
  sections: z.string(),
});

export type ConfigInput = z.infer<typeof configInputValidator>;

export const configValidator = configInputValidator.transform((config) => {
  const wsUrl = new URL(config.url);
  wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";

  return {
    ...config,
    url: new URL(config.url).toString(),
    wsUrl: wsUrl.toString(),
  };
});

export type Config = z.infer<typeof configValidator>;

export const propTypeValidator = z.union([
  z.literal("string"),
  z.literal("number"),
  z.literal("boolean"),
]);

export type PropType = z.infer<typeof propTypeValidator>;

export const propsSchemaValidator = z
  .record(
    z.object({
      type: propTypeValidator,
      required: z.boolean(),
      default: z.any().optional(),
    })
  )
  .nullable();

export type PropsSchema = z.infer<typeof propsSchemaValidator>;

export const propsValidator = z.record(z.unknown()).nullable();

export const componentValidator = z.object({
  name: z.string(),
  propsSchema: propsSchemaValidator,
});

export type Component = z.infer<typeof componentValidator>;

export const pageValidator = z.object({
  id: z.string(),
  slug: z.string(),
  sections: z.array(
    z.object({
      id: z.string(),
      componentName: z.string(),
      props: propsValidator,
    })
  ),
});

export const pagesValidator = z.array(
  z.object({
    id: z.string(),
    slug: z.string(),
  })
);

export const msgUpdateComponents = z.object({
  kind: z.literal("components:update"),
  components: z.array(componentValidator),
});

export type UpdateComponentsMessage = z.infer<typeof msgUpdateComponents>;

export const msgUpdatePage = z.object({
  kind: z.literal("page:update"),
  pageId: z.string(),
  updates: z.array(
    z.object({
      operation: z.enum(["add", "update", "remove"]),
      order: z.number(),
      componentName: z.string(),
      props: propsValidator,
    })
  ),
});

export type UpdatePageMessage = z.infer<typeof msgUpdatePage>;

export const msgHmrReload = z.object({
  kind: z.literal("hmr:reload"),
});

export const msgRectChange = z.object({
  kind: z.literal("rect:change"),
  sectionId: z.string(),
  order: z.number(),
  rect: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    bottom: z.number().default(0),
    left: z.number().default(0),
    right: z.number().default(0),
    top: z.number().default(0),
  }),
});

export type RectChangeMessage = z.infer<typeof msgRectChange>;

export const msgMouseMove = z.object({
  kind: z.literal("mouse:move"),
  x: z.number(),
  y: z.number(),
});

export type MouseMoveMessage = z.infer<typeof msgMouseMove>;

export const msgMouseClick = z.object({
  kind: z.literal("mouse:click"),
  x: z.number(),
  y: z.number(),
});

export type MouseClickMessage = z.infer<typeof msgMouseClick>;

export const realtimeMessage = z.union([
  msgUpdateComponents,
  msgUpdatePage,
  msgHmrReload,
  msgRectChange,
  msgMouseMove,
  msgMouseClick,
]);

export type RealtimeMessage = z.infer<typeof realtimeMessage>;
