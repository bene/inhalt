import { componentValidator, propsSchemaValidator } from "@inhalt/schema";
import { z } from "zod";

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
  update: publicProcedure
    .input(
      z.object({
        components: z.array(componentValidator),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await prisma.component.deleteMany();
      await prisma.component.createMany({
        data: input.components.map((c) => ({
          name: c.name,
          propsSchema: c.propsSchema as any,
        })),
      });

      console.log("✨ Components updated");
    }),
});
