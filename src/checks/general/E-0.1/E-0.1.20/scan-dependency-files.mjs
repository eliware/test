import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "@babel/parser";
import {
  moduleParserOptions,
  repositorySourceParserOptions,
} from "../../../create-repository-ast-cache.mjs";
import { findRepositoryFiles } from "../find-repository-files.mjs";
import { collectAstReferences } from "./collect-ast-dependency-references.mjs";
import { collectStructuredValues } from "./collect-structured-dependency-references.mjs";

const sourceFile = /\.(?:mjs|js|cjs|ts|tsx|cts)$/iu;
const structuredConfig = /(?:^|\/)(?:\.eslintrc(?:\.[^.]+)?|\.prettierrc(?:\.[^.]+)?|jest\.config\.json|(?:tsconfig|oxlint|knip|vite|webpack|rollup)\.[^.]+\.json)$/iu;

export async function scanDependencyFiles(
  root,
  declared,
  referenced,
  uncertain,
  repositoryFiles = null,
  parseAst = null,
  inventory = null,
) {
  for (const file of repositoryFiles ?? await findRepositoryFiles(root)) {
    if (sourceFile.test(file)) {
      if (repositoryFiles && !file.startsWith("src/")) continue;
      try {
        const options = file.endsWith(".mjs")
          ? moduleParserOptions
          : repositorySourceParserOptions;
        const ast = parseAst
          ? await parseAst(root, file, options)
          : parse(await readFile(join(root, file), "utf8"), options);
        collectAstReferences(ast, declared, referenced, uncertain);
      } catch { /* Invalid source is reported by the syntax checks. */ }
    } else if (structuredConfig.test(file) || /(?:^|\/)package\.json$/iu.test(file)) {
      try {
        const path = join(root, file);
        const document = inventory
          ? await inventory.readParsed(path, "json", JSON.parse)
          : JSON.parse(await readFile(path, "utf8"));
        collectStructuredValues(document, declared, referenced);
      }
      catch { /* Invalid structured files are reported by their owning checks. */ }
    }
  }
}
