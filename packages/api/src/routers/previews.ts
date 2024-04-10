import { z } from "zod";

import {
  componentValidator,
  previewBuildStatusValidator,
} from "@inhalt/schema";
import { k8sAppApi } from "../k8s";
import { prisma } from "../prisma";
import { publicProcedure, router } from "../trpc";

export const previewsRouter = router({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().toLowerCase(),
      })
    )
    .mutation(async ({ input }) => {}),
  update: publicProcedure
    .input(
      z.object({
        buildId: z.string().uuid(),
        status: previewBuildStatusValidator.optional(),
        components: z.array(componentValidator).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { buildId } = input;
      const { project } = await prisma.previewBuild.findFirstOrThrow({
        where: { id: buildId },
        include: {
          project: true,
        },
      });

      await prisma.previewBuild.update({
        where: { id: buildId },
        data: {
          status: input.status,
          components: input.components,
        },
      });

      if (input.status !== "Successful") {
        return;
      }

      // Update deployment
      await k8sAppApi.patchNamespacedDeployment(project.name, "default", {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  name: project.name,
                  image: `us-central1-docker.pkg.dev/sandbox-bene/preview/${project.name}:${buildId}`,
                },
              ],
            },
          },
        },
      });
    }),
});
