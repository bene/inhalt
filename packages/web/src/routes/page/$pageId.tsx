import { createFileRoute, useLoaderData } from "@tanstack/react-router";

import { Editor } from "../../components/Editor";
import { trpc } from "../../trpc";

export const Route = createFileRoute("/page/$pageId")({
  component: Page,
  loader: async ({ params }) => {
    const page = await trpc.pages.get.query({ id: params.pageId });
    const components = await trpc.components.list.query();

    if (!page) {
      throw {
        status: 404,
        error: "Page not found",
      };
    }

    return {
      page,
      components,
    };
  },
  errorComponent: ({ error }) => {
    return <div>Error: {JSON.stringify(error)}</div>;
  },
});

function Page() {
  const data = useLoaderData({ from: "/page/$pageId" });
  return <Editor page={data.page} />;
}
