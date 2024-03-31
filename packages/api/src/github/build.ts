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
        name: "gcr.io/cloud-builders/gsutil",
        entrypoint: "git",
        args: ["clone", cloneUrl, "/workspace"],
      },
      {
        name: "node",
        entrypoint: "npm",
        args: "install",
      },
      {
        name: "gcr.io/cloud-builders/gsutil",
        args: [
          "-m",
          "cp",
          "-r",
          "public*",
          "gs://previews.daisycms.com/$BUILD_ID",
        ],
      },
    ],
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
