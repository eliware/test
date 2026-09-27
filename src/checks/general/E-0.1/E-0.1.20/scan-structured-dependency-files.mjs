import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { collectStructuredValues } from "./collect-structured-dependency-references.mjs";

const structuredConfig = /(?:^|\/)(?:\.eslintrc(?:\.[^.]+)?|\.prettierrc(?:\.[^.]+)?|jest\.config\.json|(?:tsconfig|oxlint|knip|vite|webpack|rollup)\.[^.]+\.json)$/iu;
const packageManifest = /(?:^|\/)package\.json$/iu;

export async function scanStructuredDependencyFiles(root, files, declared, referenced, inventory = null) {
  for (const file of files) {
    if (!structuredConfig.test(file) && !packageManifest.test(file)) continue;
    try {
      const path = join(root, file);
      const document = inventory
        ? await inventory.readParsed(path, "json", JSON.parse)
        : JSON.parse(await readFile(path, "utf8"));
      collectStructuredValues(document, declared, referenced);
    } catch { /* Invalid structured files are reported by their owning checks. */ }
  }
}
