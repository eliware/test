import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "@babel/parser";
import {
  moduleParserOptions,
  repositorySourceParserOptions,
} from "../../../create-repository-ast-cache.mjs";
import { collectAstReferences } from "./collect-ast-dependency-references.mjs";

const sourceFile = /\.(?:mjs|js|cjs|ts|tsx|cts)$/iu;

export async function scanSourceDependencyFiles(
  root,
  files,
  declared,
  referenced,
  uncertain,
  parseAst = null,
) {
  for (const file of files) {
    if (!sourceFile.test(file)) continue;
    try {
      const options = file.endsWith(".mjs") ? moduleParserOptions : repositorySourceParserOptions;
      const ast = parseAst
        ? await parseAst(root, file, options)
        : parse(await readFile(join(root, file), "utf8"), options);
      collectAstReferences(ast, declared, referenced, uncertain);
    } catch {
      /* Invalid source is reported by the syntax checks. */
    }
  }
}
