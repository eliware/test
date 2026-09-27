import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "@babel/parser";
import {
  moduleParserOptions,
  repositorySourceParserOptions,
} from "../../../create-repository-ast-cache.mjs";
import { findRepositoryFiles } from "../find-repository-files.mjs";
import { collectCommonJsFindings } from "./commonjs-ast-analysis.mjs";

const moduleExtension = /\.(?:mjs|js|cjs|ts|tsx)$/i;

export async function scanCommonJsFiles(root, repositoryFiles = null, parseAst = null) {
  const findings = [];
  const files = repositoryFiles ?? (await findRepositoryFiles(root));
  for (const file of files.filter((candidate) => moduleExtension.test(candidate))) {
    if (/\.(?:cjs|cts)$/i.test(file)) {
      findings.push(`${file}: CommonJS module extension`);
      continue;
    }
    try {
      const options = file.endsWith(".mjs") ? moduleParserOptions : repositorySourceParserOptions;
      const ast = parseAst
        ? await parseAst(root, file, options)
        : parse(await readFile(join(root, file), "utf8"), options);
      collectCommonJsFindings(ast, findings, file);
    } catch (error) {
      findings.push(`${file}: invalid module syntax (${error.message})`);
    }
  }
  return findings;
}
