import { propsSchemaValidator } from "@inhalt/schema";
import { prisma } from "../prisma";
import { publicProcedure, router } from "../trpc";

export const componentsRouter = router({
  list: publicProcedure.query(async ({ ctx, input }) => {
    const components = await prisma.component.findMany({});
    const validated = components.map((c) => ({
      ...c,
      propsSchema: propsSchemaValidator.parse(c.propsSchema),
    }));

    return validated;
  }),
});
