import { propsValidator } from "@inhalt/schema";
import { z } from "zod";

import { prisma } from "../prisma";
import { publicProcedure, router } from "../trpc";

export const pagesRouter = router({
  list: publicProcedure.query(async ({ ctx, input }) => {
    const pages = await prisma.page.findMany({});
    return pages;
  }),
  get: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const page = await prisma.page.findUnique({
        where: {
          id: input.id,
        },
        select: {
          id: true,
          slug: true,
          sections: {
            select: {
              id: true,
              order: true,
              componentName: true,
              props: true,
            },
          },
        },
      });

      if (!page) {
        return null;
      }

      const validated = {
        ...page,
        sections: page.sections.map((s) => ({
          ...s,
          props: propsValidator.parse(s.props),
        })),
      };

      return validated;
    }),
});
