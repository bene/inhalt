import { z } from "zod";

export const configValidator = z.object({
  url: z.string(),
  sections: z.string(),
});

export type Config = z.infer<typeof configValidator>;

export const propsSchemaValidator = z
  .record(
    z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean(),
      default: z.any(),
    })
  )
  .nullable();

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

export const realtimeMessage = z.union([
  msgUpdateComponents,
  msgUpdatePage,
  msgHmrReload,
]);

export type RealtimeMessage = z.infer<typeof realtimeMessage>;
