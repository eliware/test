import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { scanCommonJsSourceModule } from "./parse-source-module.mjs";

const moduleFile = /\.(?:mjs|js|jsx|cjs|ts|tsx|cts|mts|mjsx|cjsx)$/iu;
const commonJsExtension = /\.(?:cjs|cts)$/iu;

export async function scanCommonJsFile(root, file, parseAst, read = readFile) {
  if (!moduleFile.test(file)) return [];
  if (commonJsExtension.test(file)) return [`${file}: CommonJS module extension`];
  return scanCommonJsSourceModule({
    root,
    file,
    parseAst,
    readSource: async (path, repositoryRoot) => read(join(repositoryRoot, path), "utf8"),
  });
}
