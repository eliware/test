import { readFile } from "node:fs/promises";
import { parse } from "@babel/parser";
import { createRepositoryAstParseCache } from "./create-repository-ast-parse-cache.mjs";
import { createRepositoryAstCacheKey } from "./create-repository-ast-cache-key.mjs";
import { createRepositoryAstSourceReader } from "./create-repository-ast-source-reader.mjs";
import { resolveRepositoryAstFile } from "./resolve-repository-ast-file.mjs";

export const moduleParserOptions = Object.freeze({ sourceType: "module" });
export const repositorySourceParserOptions = Object.freeze({
  sourceType: "unambiguous",
  plugins: Object.freeze(["typescript", "jsx", "topLevelAwait"]),
});

export function createRepositoryAstCache({ read = readFile, parseSource = parse } = {}) {
  const readSource = createRepositoryAstSourceReader(read);
  const parseCachedSource = createRepositoryAstParseCache(parseSource);

  return async function parseRepositoryAst(root, file, options, suppliedSource) {
    const repositoryAstFile = resolveRepositoryAstFile(root, file);
    const { absoluteFile } = repositoryAstFile;
    const parseUncached = () =>
      (suppliedSource === undefined
        ? Promise.resolve().then(() => read(absoluteFile, "utf8"))
        : Promise.resolve(suppliedSource)
      ).then((source) => parseSource(source, options));
    const key = createRepositoryAstCacheKey(root, repositoryAstFile.repositoryFile, options);
    if (key === null || suppliedSource !== undefined) return parseUncached();
    return parseCachedSource(key, () => readSource(key, absoluteFile, suppliedSource), options);
  };
}
