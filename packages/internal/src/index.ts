import { type Config } from "@inhalt/schema";
import { readFile, readdir, writeFile } from "fs/promises";
import { join } from "path";
import { Node, Project } from "ts-morph";

export async function getComponents(config: Config, rootPath: string) {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      plugins: [{ name: "@astrojs/ts-plugind" }],
    },
  });

  const files = await readdir(config.sections);
  const components = files.map(async (file) => {
    let propsSchema = null;
    const name = file.split(".astro")[0];
    const path = join(rootPath, config.sections, file);

    // Parse props
    const sourceText = await readFile(
      join(rootPath, config.sections, file),
      "utf-8"
    );
    const source = project.createSourceFile(file, sourceText);

    const propsInterface = source.getInterface("Props");
    if (propsInterface) {
      propsSchema = propsInterface.getProperties().map((prop) => ({
        name: prop.getName(),
        type: prop.getTypeNode()?.getText(),
      }));
    }

    const propsTypeAlias = source.getTypeAlias("Props");
    if (propsTypeAlias) {
      const node = propsTypeAlias.getTypeNode();

      if (Node.isTypeLiteral(node)) {
        propsSchema = node.getProperties().map((props) => ({
          name: props.getName(),
          type: props.getTypeNode()?.getText(),
        }));
      }
    }

    return {
      name,
      path,
      propsSchema,
    };
  });

  return components;
}

export async function generateComponentsFile(
  config: Config,
  rootPath: string,
  pwd: string
) {
  const files = await readdir(config.sections);
  const components = files.map((file) => {
    const componentName = file.split(".astro")[0];

    return {
      name: componentName,
      path: join(rootPath, config.sections, file),
    };
  });

  let sectionsFileSource = components
    .map((c) => `import ${c.name} from "${c.path}"`)
    .join("\n");
  sectionsFileSource += `\n\nexport default {${components
    .map((c) => c.name)
    .join(", ")}}`;

  // Save to node_modules/inhalt a la prisma client
  await writeFile(
    join(pwd, "..", "gen", "sections.gen.ts"),
    sectionsFileSource
  );

  // Return the component names
  return components.map((c) => c.name);
}
