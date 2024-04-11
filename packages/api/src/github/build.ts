import type { Project } from "@prisma/client";
import { GoogleAuth } from "google-auth-library";

import { config } from "../config";
import { prisma } from "../prisma";

function generateDockerfile(
  buildId: string,
  environment: Record<string, string>
) {
  return `FROM oven/bun:1 as build
COPY . .

FROM build as migrate

${Object.entries(environment)
  .map(([name, value]) => `ENV ${name}=${value}`)
  .join("\n")}
ENV INHALT_ENV=build_preview
ENV INHALT_PREVIEW_BUILD_ID=${buildId}


RUN cd $INHALT_ROOT_DIR && bunx --bun astro dev
RUN bunx inhalt-migrate


FROM build

${Object.entries(environment)
  .map(([name, value]) => `ENV ${name}=${value}`)
  .join("\n")}
ENV INHALT_ENV=preview
RUN bunx astro preferences disable devToolbar
EXPOSE 4321
ENTRYPOINT ["bunx", "--bun", "astro", "dev", "--port", "4321", "--host", "0.0.0.0"]`;
}

export async function triggerCloudBuild(
  project: Pick<Project, "id" | "name">,
  cloneUrl: string
) {
  const auth = new GoogleAuth({
    keyFilename: "google-cloud-credentials.json",
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });
  const client = await auth.getClient();
  const gcpProjectId = await auth.getProjectId();
  const build = await prisma.previewBuild.create({
    data: {
      commitHash: "TODO",
      projectId: project.id,
    },
  });

  const envVariables = await prisma.previewBuildEnvironmentVariable.findMany({
    where: {
      projectId: project.id,
    },
  });
  const env = envVariables.reduce(
    (acc, { name, value }) => {
      acc[name] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  const body = {
    steps: [
      {
        name: "gcr.io/cloud-builders/git",
        args: ["clone", cloneUrl, "/workspace"],
      },
      {
        name: "oven/bun:1",
        entrypoint: "bun",
        args: ["install", "--frozen-lock-file"],
      },
      {
        name: "busybox",
        script: `echo '${generateDockerfile(build.id, env)}' > Dockerfile`,
      },
      {
        name: "gcr.io/cloud-builders/docker",
        args: [
          "build",
          "-t",
          `${config.gcpArtifactRegistryUrl}${project.name}:${build.id}`,
          ".",
        ],
      },
      {
        name: "gcr.io/cloud-builders/docker",
        args: [
          "push",
          `${config.gcpArtifactRegistryUrl}${project.name}:${build.id}`,
        ],
      },
      {
        name: "gcr.io/cloud-builders/curl",
        entrypoint: "curl",
        args: [
          `${config.publicUrl}builds/${build.id}`,
          "-X",
          "PATCH",
          "-H",
          `Content-Type: application/json`,
          "-d",
          `{ \"status\": \"Successful\" }`,
        ],
      },
    ],
  };

  const res = await client.request({
    url: `https://cloudbuild.googleapis.com/v1/projects/${gcpProjectId}/locations/${config.gcCloudBuildLocation}/builds`,
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log(res);
}
