import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "@babel/parser";
import { findRepositoryFiles } from "../find-repository-files.mjs";
import { collectEnvironmentReferences } from "./environment-ast-analysis.mjs";

const sourceFile = /\.(?:mjs|js|cjs|ts|tsx)$/i;

export async function discoverEnvironmentReferences(root) {
  const variables = new Set();
  const files = await findRepositoryFiles(root);
  for (const file of files.filter((candidate) => sourceFile.test(candidate))) {
    try {
      const ast = parse(await readFile(join(root, file), "utf8"), { sourceType: "unambiguous", plugins: ["typescript", "jsx", "topLevelAwait"] });
      collectEnvironmentReferences(ast, new Set(), variables);
    } catch {
      continue;
    }
  }
  return [...variables].sort();
}
