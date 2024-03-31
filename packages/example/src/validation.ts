import { z } from "zod";

// Belongs to SDK
export const pageResponseValidator = z.object({
  title: z.string(),
  sections: z.array(
    z.object({
      componentName: z.string(),
      props: z.record(z.unknown()),
    })
  ),
});

export const pagesResponseValidator = z.array(
  z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
  })
);
