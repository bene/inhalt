import { Link, createFileRoute, useLoaderData } from "@tanstack/react-router";

import { trpc } from "../trpc";

export const Route = createFileRoute("/")({
  component: Index,
  loader: async () => {
    const pages = await trpc.pages.list.query();

    return {
      pages,
    };
  },
});

function Index() {
  const { pages } = useLoaderData({ from: "/" });

  return (
    <div className="p-2 container max-w-6xl">
      <h1 className="text-2xl font-bold">Pages</h1>
      <div className="grid grid-cols-3 gap-4">
        {pages.map((page) => (
          <div key={page.id} className="bg-gray-100 p-2 rounded-md">
            <Link
              to="/page/$pageId"
              params={{
                pageId: page.id,
              }}
            >
              {page.slug}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
