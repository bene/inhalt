import { GoogleAuth } from "google-auth-library";

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
        name: "gcr.io/cloud-builders/wget",
        args: [
          "https://gist.githubusercontent.com/bene/7496c2849bc2c118d63abd1db04f88a7/raw/b9b3e1fb0b5fca1e347703d76c4dc7934e8d10ca/Dockerfile",
        ],
      },
      {
        name: "gcr.io/cloud-builders/docker",
        args: [
          "build",
          "-t",
          "us-central1-docker.pkg.dev/$PROJECT_ID/preview/project1:latest",
          ".",
        ],
        // script: `echo "--" && pwd && ls`,
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
