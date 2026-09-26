import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "@babel/parser";
import { findRepositoryFiles } from "../find-repository-files.mjs";
import { collectEnvironmentReferences } from "./environment-ast-analysis.mjs";

const sourceFile = /\.(?:mjs|js|cjs|ts|tsx)$/i;

export async function discoverEnvironmentReferences(root, repositoryFiles = null) {
  const variables = new Set();
  const files = repositoryFiles ?? await findRepositoryFiles(root);
  for (const file of files.filter((candidate) => sourceFile.test(candidate))) {
    if (repositoryFiles && !file.startsWith("src/")) continue;
    const ast = parse(await readFile(join(root, file), "utf8"), { sourceType: "unambiguous", plugins: ["typescript", "jsx", "topLevelAwait"] });
    collectEnvironmentReferences(ast, new Set(), variables);
  }
  return [...variables].sort();
}
