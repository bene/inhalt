import { z } from "zod";

const configValidator = z
  .object({
    PUBLIC_URL: z.string().url(),
    GCP_PROJECT_ID: z.string(),
    GCP_ARTIFACT_REGISTRY_REGION: z.string(),
    GCP_ARTIFACT_REGISTRY_REPO: z.string(),
    GCP_CLOUD_BUILD_LOCATION: z.string(),
    GITHUB_APP_ID: z.coerce.number(),
    IMAGE_PULL_SECRET: z.string().optional(),
  })
  .transform((config) => ({
    imagePullSecret: config.IMAGE_PULL_SECRET,
    publicUrl: new URL(config.PUBLIC_URL),
    githubAppId: config.GITHUB_APP_ID.toString(),
    gcCloudBuildLocation: config.GCP_CLOUD_BUILD_LOCATION,
    gcpArtifactRegistryUrl: `${config.GCP_ARTIFACT_REGISTRY_REGION}-docker.pkg.dev/${config.GCP_PROJECT_ID}/${config.GCP_ARTIFACT_REGISTRY_REPO}/`,
  }));

export const config = Object.freeze(
  configValidator.parse({
    IMAGE_PULL_SECRET: import.meta.env.IMAGE_PULL_SECRET,
    PUBLIC_URL: import.meta.env.PUBLIC_URL,
    GITHUB_APP_ID: import.meta.env.GITHUB_APP_ID,
    GCP_PROJECT_ID: import.meta.env.GCP_PROJECT_ID,
    GCP_CLOUD_BUILD_LOCATION: import.meta.env.GCP_CLOUD_BUILD_LOCATION,
    GCP_ARTIFACT_REGISTRY_REGION: import.meta.env.GCP_ARTIFACT_REGISTRY_REGION,
    GCP_ARTIFACT_REGISTRY_REPO: import.meta.env.GCP_ARTIFACT_REGISTRY_REPO,
  })
);
