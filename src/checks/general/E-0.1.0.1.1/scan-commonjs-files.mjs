import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { findRepositoryFiles } from "../../../validation/shared/repository/find-repository-files.mjs";
import { scanCommonJsSourceModule } from "./scan/parse-source-module.mjs";

const moduleFile = /\.(?:mjs|js|jsx|cjs|ts|tsx|cts|mts|mjsx|cjsx)$/iu;

export async function scanCommonJsFiles(root, files, parseAst) {
  const findings = [];
  const candidates = files ?? (await findRepositoryFiles(root));
  for (const file of candidates.filter((path) => moduleFile.test(path))) {
    if (/\.(?:cjs|cts)$/iu.test(file)) {
      findings.push(`${file}: CommonJS module extension`);
      continue;
    }
    findings.push(
      ...(await scanCommonJsSourceModule({
        root,
        file,
        parseAst,
        readSource: async (path, repositoryRoot) => readFile(join(repositoryRoot, path), "utf8"),
      })),
    );
  }
  return findings;
}
