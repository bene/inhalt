import { z } from "zod";

import { caller } from "../caller";
import { prisma } from "../prisma";
import { publicProcedure, router } from "../trpc";

export const projectsRouter = router({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().toLowerCase(),
      })
    )
    .mutation(async ({ input }) => {
      const project = await prisma.project.create({
        data: {
          name: input.name,
        },
      });

      await caller.internal.previews.deployments.setup({
        projectName: project.name,
      });
    }),
});
