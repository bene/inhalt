import { z } from "zod";

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

export const pageValidator = z.object({
  id: z.string(),
  slug: z.string(),
  sections: z.array(
    z.object({
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
  components: z.array(
    z.object({
      name: z.string(),
      propsSchema: propsSchemaValidator,
    })
  ),
});

export const msgUpdatePage = z.object({
  kind: z.literal("page:update"),
  sections: z.array(
    z.object({
      id: z.string(),
      componentName: z.string(),
      props: propsValidator,
    })
  ),
});

export const msgHmrReload = z.object({
  kind: z.literal("hmr:reload"),
});

export const realtimeMessage = z.union([
  msgUpdateComponents,
  msgUpdatePage,
  msgHmrReload,
]);

export type RealtimeMessage = z.infer<typeof realtimeMessage>;
