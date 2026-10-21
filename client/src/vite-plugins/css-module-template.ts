import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const runtimeHelperPath = fileURLToPath(
  new URL("../tools/css-module-template-runtime.ts", import.meta.url),
);

function getTemplatePath (id: string): string | null {
  const [filePath, query = ""] = id.split("?");
  if (!new URLSearchParams(query).has("css-module") || !filePath.endsWith(".template.html")) {
    return null;
  }
  return filePath;
}

function getRelativeImport (fromDirectory: string, targetPath: string): string {
  const relativePath = path.relative(fromDirectory, targetPath).split(path.sep).
    join("/");
  return relativePath.startsWith(".")
    ? relativePath
    : `./${relativePath}`;
}

export function cssModuleTemplatePlugin (): Plugin {
  return {
    name: "css-module-template",
    enforce: "pre",
    transform (source, id) {
      const templatePath = getTemplatePath(id);
      if (templatePath === null) return null;

      const cssModulePath = templatePath.replace(/\.template\.html$/, ".module.css");
      if (!existsSync(cssModulePath)) {
        this.error(`No matching CSS Module found for template "${templatePath}".`);
      }

      const templateDirectory = path.dirname(templatePath);
      const cssModuleImport = getRelativeImport(templateDirectory, cssModulePath);
      const runtimeHelperImport = getRelativeImport(templateDirectory, runtimeHelperPath);

      return {
        code: [
          `import styles from ${JSON.stringify(cssModuleImport)};`,
          `import { mapTemplateClasses } from ${JSON.stringify(runtimeHelperImport)};`,
          `export default mapTemplateClasses(${JSON.stringify(source)}, styles);`,
        ].join("\n"),
        map: null,
      };
    },
  };
}
