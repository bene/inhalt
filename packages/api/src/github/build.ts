import { GoogleAuth } from "google-auth-library";
import { config } from "../config";
import { prisma } from "../prisma";

function generateDockerfile(buildId: string) {
  return `FROM oven/bun:1 as build
COPY . .

FROM build as migrate

ENV INHALT_ENV=build_preview
ENV INHALT_ROOT_DIR=./packages/example
ENV INHALT_PREVIEW_BUILD_ID=${buildId}


RUN cd $INHALT_ROOT_DIR && bunx --bun astro dev
RUN bunx inhalt-migrate


FROM build

ENV INHALT_ENV=preview
RUN bunx astro preferences disable devToolbar
EXPOSE 4321
ENTRYPOINT ["bunx", "--bun", "astro", "dev", "--port", "4321", "--host", "0.0.0.0"]`;
}

export async function triggerCloudBuild(cloneUrl: string) {
  const auth = new GoogleAuth({
    keyFilename: "google-cloud-credentials.json",
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });
  const client = await auth.getClient();
  const gcpProjectId = await auth.getProjectId();

  const project = {
    id: "eb9b2f94-88f0-4531-9103-209baba21c93",
    name: "hello-world",
  };
  const build = await prisma.previewBuild.create({
    data: {
      commitHash: "TODO",
      projectId: project.id,
    },
  });

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
        script: `echo '${generateDockerfile(build.id)}' > Dockerfile`,
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
          `Content-Type:application/json`,
          "-d",
          `"{ \"status\": \"Successful\" }"`,
        ],
      },
    ],
  };

  const res = await client.request({
    url: `https://cloudbuild.googleapis.com/v1/projects/${gcpProjectId}/locations/europe-west3/builds`,
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log(res);
}
