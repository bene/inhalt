import { z } from "zod";

const configValidator = z
  .object({
    PUBLIC_URL: z.string().url(),
    GCP_ARTIFACT_REGISTRY_URL: z.string(),
  })
  .transform((config) => ({
    publicUrl: new URL(config.PUBLIC_URL),
    gcpArtifactRegistryUrl: config.GCP_ARTIFACT_REGISTRY_URL,
  }));

export const config = Object.freeze(
  configValidator.parse({
    PUBLIC_URL: import.meta.env.PUBLIC_URL,
    GCP_ARTIFACT_REGISTRY_URL: import.meta.env.GCP_ARTIFACT_REGISTRY_URL,
  })
);
