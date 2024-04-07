import { GoogleAuth } from "google-auth-library";

const dockerfileSource = `FROM oven/bun:1 as build
COPY . .

FROM build as migrate

ENV INHALT_ENV=build_preview
ENV INHALT_ROOT_DIR=./packages/example


RUN cd $INHALT_ROOT_DIR && bunx --bun astro dev
RUN bunx inhalt-migrate


FROM build

ENV INHALT_ENV=preview
RUN bunx astro preferences disable devToolbar
EXPOSE 4321
ENTRYPOINT ["bunx", "--bun", "astro", "dev", "--port", "4321", "--host", "0.0.0.0"]`;

export async function triggerCloudBuild(cloneUrl: string) {
  const auth = new GoogleAuth({
    keyFilename: "google-cloud-credentials.json",
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });
  const client = await auth.getClient();
  const projectId = await auth.getProjectId();

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
        script: `echo '${dockerfileSource}' > Dockerfile`,
      },
      {
        name: "gcr.io/cloud-builders/docker",
        args: [
          "build",
          "-t",
          "us-central1-docker.pkg.dev/$PROJECT_ID/preview/project1:latest",
          ".",
        ],
      },
    ],
    artifacts: {
      images: [
        "us-central1-docker.pkg.dev/$PROJECT_ID/preview/project1:latest",
      ],
    },
  };

  const res = await client.request({
    url: `https://cloudbuild.googleapis.com/v1/projects/${projectId}/locations/global/builds`,
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log(res);
}
