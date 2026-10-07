import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "@babel/parser";
import {
  moduleParserOptions,
  repositorySourceParserOptions,
} from "../../../validation/shared/ast/create-repository-ast-cache.mjs";
import { findRepositoryFiles } from "../../../validation/shared/repository/find-repository-files.mjs";
import { collectCommonJsFindings } from "./collect-commonjs-findings.mjs";

const moduleFile = /\.(?:mjs|js|jsx|cjs|ts|tsx|cts|mts|mjsx|cjsx)$/iu;

export async function scanCommonJsFiles(root, files, parseAst) {
  const findings = [];
  const candidates = files ?? (await findRepositoryFiles(root));
  for (const file of candidates.filter((path) => moduleFile.test(path))) {
    if (/\.(?:cjs|cts)$/iu.test(file)) {
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
