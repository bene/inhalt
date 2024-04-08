import { propsValidator, sectionValidator } from "@inhalt/schema";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { broadcastRealtimeMessage } from "../index";
import { prisma } from "../prisma";
import { publicProcedure, router } from "../trpc";

export const pagesRouter = router({
  sections: router({
    add: publicProcedure
      .input(
        z.object({
          pageId: z.string(),
          at: z.number(),
          section: sectionValidator.omit({
            id: true,
          }),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await prisma.$transaction([
          prisma.section.updateMany({
            where: {
              pageId: input.pageId,
              order: {
                gte: input.at,
              },
            },
            data: {
              order: {
                increment: 1,
              },
            },
          }),
          prisma.section.create({
            data: {
              pageId: input.pageId,
              componentName: input.section.componentName,
              order: input.at,
              props: (input.section.props as any) ?? Prisma.DbNull,
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
      }),
  }),
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
