import { pageValidator } from "@inhalt/schema";

export async function getPage(pageSlug: string) {
  const res = await fetch(`http://localhost:3000/page/${pageSlug ?? "index"}`);
  const raw = await res.json();
  const page = pageValidator.parse(raw);

  return page;
}
