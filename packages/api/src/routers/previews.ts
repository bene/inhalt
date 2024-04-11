import {
  componentValidator,
  previewBuildStatusValidator,
} from "@inhalt/schema";
import { HttpError } from "@kubernetes/client-node";
import { z } from "zod";

import { caller } from "../caller";
import { config } from "../config";
import { k8sAppApi, k8sCoreApi, k8sNetworkingApi } from "../k8s";
import { prisma } from "../prisma";
import { publicProcedure, router } from "../trpc";

export const previewsRouter = router({
  deployments: router({
    setup: publicProcedure
      .input(
        z.object({
          projectName: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const project = await prisma.project.findUniqueOrThrow({
          where: {
            name: input.projectName,
          },
        });
        const projectName = project.name;

        // Create preview service
        try {
          await k8sCoreApi.createNamespacedService("default", {
            metadata: {
              name: projectName,
            },
            spec: {
              selector: {
                app: projectName,
              },
              ports: [
                {
                  protocol: "TCP",
                  port: 80,
                  targetPort: 4321,
                },
              ],
            },
          });
        } catch (e: unknown) {
          if (e instanceof HttpError) {
            console.log(e.body);
          } else {
            console.error(e);
          }
        }

        const { body: ingress } = await k8sNetworkingApi.readNamespacedIngress(
          "previews",
          "default"
        );

        // Add a new rule to ingress
        ingress.spec?.rules?.push({
          host: `${project.name}.previews.solidlabs.com`,
          http: {
            paths: [
              {
                path: "/",
                pathType: "Prefix",
                backend: {
                  service: {
                    name: project.name,
                    port: {
                      number: 80,
                    },
                  },
                },
              },
            ],
          },
        });

        try {
          await k8sNetworkingApi.replaceNamespacedIngress(
            "previews",
            "default",
            ingress
          );
        } catch (e: unknown) {
          if (e instanceof HttpError) {
            console.log(e.body);
          } else {
            console.error(e);
          }
        }
      }),
    update: publicProcedure
      .input(
        z.object({
          projectId: z.string().uuid(),
          buildId: z.string().uuid().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const build = await prisma.previewBuild.findFirstOrThrow({
          where: {
            id: input.buildId,
            projectId: input.projectId,
            status: "Successful",
          },
          orderBy: {
            finishedAt: "desc",
          },
          select: {
            id: true,
            project: {
              select: {
                name: true,
              },
            },
          },
        });

        const name = build.project.name;
        let hasDeployment: boolean;

        try {
          await k8sAppApi.readNamespacedDeployment(name, "default");
          hasDeployment = true;
        } catch (e: unknown) {
          if (e instanceof HttpError && e.response.statusCode === 404) {
            hasDeployment = false;
          } else {
            throw e;
          }
        }

        // If deployment does not exist, create it
        if (!hasDeployment) {
          try {
            await k8sAppApi.createNamespacedDeployment("default", {
              metadata: {
                name,
                labels: {
                  app: name,
                },
              },
              spec: {
                replicas: 1,
                selector: {
                  matchLabels: {
                    app: name,
                  },
                },
                template: {
                  metadata: {
                    labels: {
                      app: name,
                    },
                  },
                  spec: {
                    containers: [
                      {
                        name,
                        image: `${config.gcpArtifactRegistryUrl}${name}:${build.id}`,
                        ports: [
                          {
                            containerPort: 4321,
                          },
                        ],
                      },
                    ],
                    imagePullSecrets: [
                      {
                        name: "artifact-registry",
                      },
                    ],
                  },
                },
              },
            });
          } catch (e: unknown) {
            if (e instanceof HttpError) {
              console.log(e.body);
            } else {
              console.error(e);
            }
          }
          return;
        }

        // Otherwise Update deployment
        try {
          await k8sAppApi.patchNamespacedDeployment(
            name,
            "default",
            [
              {
                op: "replace",
                path: `/spec/template/spec/containers/0/image`,
                value: `${config.gcpArtifactRegistryUrl}${name}:${build.id}`,
              },
            ],
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            {
              headers: {
                "Content-Type": "application/json-patch+json",
              },
            }
          );
        } catch (e: unknown) {
          if (e instanceof HttpError) {
            console.log(e.body);
          } else {
            console.error(e);
          }
        }
      }),
  }),
  builds: router({
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

        const build = await prisma.previewBuild.update({
          where: { id: buildId },
          data: {
            status: input.status,
            components: input.components,
            finishedAt: input.status ? new Date() : undefined,
          },
          select: {
            id: true,
            status: true,
          },
        });

        if (build.status !== "Successful") {
          return;
        }

        // Check if build should be deployed
        const latestBuild = await prisma.previewBuild.findFirst({
          where: {
            projectId: project.id,
            status: "Successful",
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (latestBuild && latestBuild.id !== build.id) {
          return;
        }

        await caller.internal.previews.deployments.update({
          projectId: project.id,
          buildId,
        });
      }),
  }),
});
