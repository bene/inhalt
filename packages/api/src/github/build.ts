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
        args: ["clone", cloneUrl, "/home/bun/app"],
      },
      {
        name: "oven/bun:1",
        entrypoint: "bun",
        args: ["run", "ls.ts"],
      },
      {
        name: "gcr.io/cloud-builders/docker",
        args: [
          "image",
          "tag",
          "oven/bun:1",
          "us-central1-docker.pkg.dev/$PROJECT_ID/preview/project1:latest",
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
