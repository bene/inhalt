import { z } from "zod";

const configValidator = z
  .object({
    PUBLIC_URL: z.string().url(),
    GCP_ARTIFACT_REGISTRY_REGION: z.string(),
    GCP_ARTIFACT_REGISTRY_REPO: z.string(),
  })
  .transform((config) => ({
    publicUrl: new URL(config.PUBLIC_URL),
    gcpArtifactRegistryUrl: `${config.GCP_ARTIFACT_REGISTRY_REGION}-docker.pkg.dev/$PROJECT_ID/${config.GCP_ARTIFACT_REGISTRY_REPO}/`,
  }));

export const config = Object.freeze(
  configValidator.parse({
    PUBLIC_URL: import.meta.env.PUBLIC_URL,
    GCP_ARTIFACT_REGISTRY_REGION: import.meta.env.GCP_ARTIFACT_REGISTRY_REGION,
    GCP_ARTIFACT_REGISTRY_REPO: import.meta.env.GCP_ARTIFACT_REGISTRY_REPO,
  })
);
