import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "@babel/parser";
import { findRepositoryFiles } from "../find-repository-files.mjs";
import { collectAstReferences } from "./collect-ast-dependency-references.mjs";
import { collectStructuredValues } from "./collect-structured-dependency-references.mjs";

const sourceFile = /\.(?:mjs|js|cjs|ts|tsx|cts)$/iu;
const structuredConfig = /(?:^|\/)(?:\.eslintrc(?:\.[^.]+)?|\.prettierrc(?:\.[^.]+)?|jest\.config\.json|(?:tsconfig|oxlint|knip|vite|webpack|rollup)\.[^.]+\.json)$/iu;

export async function scanDependencyFiles(root, declared, referenced, uncertain) {
  for (const file of await findRepositoryFiles(root)) {
    if (sourceFile.test(file)) {
      try {
        const ast = parse(await readFile(join(root, file), "utf8"), { sourceType: "unambiguous", plugins: ["typescript", "jsx", "topLevelAwait"] });
        collectAstReferences(ast, declared, referenced, uncertain);
      } catch { /* Invalid source is reported by the syntax checks. */ }
    } else if (structuredConfig.test(file) || /(?:^|\/)package\.json$/iu.test(file)) {
      try { collectStructuredValues(JSON.parse(await readFile(join(root, file), "utf8")), declared, referenced); }
      catch { /* Invalid structured files are reported by their owning checks. */ }
    }
  }
}
