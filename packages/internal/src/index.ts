import {
  propTypeValidator,
  type Config,
  type PropsSchema,
} from "@inhalt/schema";
import { readFile, readdir, writeFile } from "fs/promises";
import { join } from "path";
import { Node, Project } from "ts-morph";

export async function getComponents(config: Config) {
  const project = new Project({
    useInMemoryFileSystem: true,
  });

  const files = await readdir(join(process.cwd(), config.sections));
  const components = await Promise.all(
    files.map(async (file) => {
      let propsSchema = null;
      const name = file.split(".astro")[0];
      const path = join(process.cwd(), config.sections, file);

      // Parse props
      const sourceText = await readFile(
        join(process.cwd(), config.sections, file),
        "utf-8"
      );
      const source = project.createSourceFile(file, sourceText);

      const propsInterface = source.getInterface("Props");
      if (propsInterface) {
        propsSchema = propsInterface.getProperties().reduce((props, prop) => {
          const typeNode = prop.getTypeNode();

          if (Node.isTypeReference(typeNode)) {
            const typeName = typeNode.getTypeName();
            if (Node.isIdentifier(typeName) && typeName.getText() === "With") {
              const optionsTypeArgument = typeNode.getTypeArguments().at(1)!;

              if (Node.isTypeLiteral(optionsTypeArgument)) {
                const options = optionsTypeArgument
                  .getProperties()
                  .reduce((props, prop) => {
                    return {
                      ...props,
                      [prop.getName()]: "TODO",
                    };
                  }, {});
              }
            }
          }

          return {
            ...props,
            [prop.getName()]: {
              type: propTypeValidator.parse(prop.getTypeNode()?.getText()),
              required: false,
            },
          };
        }, {} as PropsSchema);
      }

      const propsTypeAlias = source.getTypeAlias("Props");
      if (propsTypeAlias) {
        const node = propsTypeAlias.getTypeNode();

        if (Node.isTypeLiteral(node)) {
          propsSchema = node.getProperties().reduce(
            (props, prop) => ({
              ...props,
              [prop.getName()]: {
                type: propTypeValidator.parse(prop.getTypeNode()?.getText()),
                required: false,
              },
            }),
            {} as PropsSchema
          );
        }
      }

      return {
        name,
        path,
        propsSchema,
      };
    })
  );

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
    .map((c) => `import ${c.name} from "${c.path}";`)
    .join("\n");
  sectionsFileSource += `\n\nexport default { ${components
    .map((c) => c.name)
    .join(", ")} };`;

  // Save to node_modules/inhalt a la prisma client
  await writeFile(
    join(pwd, "..", "gen", "sections.gen.ts"),
    sectionsFileSource
  );

  // Return the component names
  return components.map((c) => c.name);
}
