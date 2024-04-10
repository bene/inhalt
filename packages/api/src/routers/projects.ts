import { z } from "zod";

import { k8sAppApi, k8sCoreApi, k8sNetworkingApi } from "../k8s";
import { publicProcedure, router } from "../trpc";

export const projectsRouter = router({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().toLowerCase(),
      })
    )
    .mutation(async ({ input }) => {
      const { name } = input;

      // Create deployment
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
                  image: `us-central1-docker.pkg.dev/sandbox-bene/preview/${name}:latest`,
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

      // Create preview service
      await k8sCoreApi.createNamespacedService("default", {
        metadata: {
          name,
        },
        spec: {
          selector: {
            app: name,
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

      const { body: ingress } = await k8sNetworkingApi.readNamespacedIngress(
        "default",
        "previews"
      );

      // Add a new rule to ingress
      ingress.spec?.rules?.push({
        host: `${name}.previews.solidlabs.com`,
        http: {
          paths: [
            {
              path: "/",
              pathType: "Prefix",
              backend: {
                service: {
                  name,
                  port: {
                    number: 80,
                  },
                },
              },
            },
          ],
        },
      });

      await k8sNetworkingApi.replaceNamespacedIngress(
        "default",
        "previews",
        ingress
      );
    }),
});
