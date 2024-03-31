export async function triggerCloudBuild(cloneUrl: string) {
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

  const res = await fetch(
    "https://cloudbuild.googleapis.com/v1/projects/sandbox-bene/locations/global/builds",
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const data = await res.json();
  console.log(data);
}
