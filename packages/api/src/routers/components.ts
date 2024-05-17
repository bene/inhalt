import { componentValidator } from "@inhalt/schema";
import { z } from "zod";

import { prisma } from "../prisma";
import { publicProcedure, router } from "../trpc";

const componentsValidator = z.array(componentValidator);

export const componentsRouter = router({
  list: publicProcedure.query(async ({ ctx, input }) => {
    const lastPreviewBuild = await prisma.previewBuild.findFirst({
      where: {
        status: "Successful",
      },
      orderBy: {
        finishedAt: "desc",
      },
      select: {
        components: true,
      },
    });

    const components = componentsValidator.parse(
      lastPreviewBuild?.components ?? []
    );

    return components;
  }),
});
