import { pagesValidator } from "@inhalt/schema";

export async function getStaticPaths() {
  const res = await fetch("http://localhost:3000/pages");
  const raw = await res.json();
  const pages = pagesValidator.parse(raw);

  const paths = pages.map((page) => ({
    params: { slug: page.slug === "index" ? "/" : page.slug },
  }));

  const projectPath = Bun.main.split("node_modules/astro").at(0);
  console.log(projectPath);

  return paths;
}
