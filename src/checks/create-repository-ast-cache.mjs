import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parse } from "@babel/parser";

export const moduleParserOptions = Object.freeze({ sourceType: "module" });
export const repositorySourceParserOptions = Object.freeze({
  sourceType: "unambiguous",
  plugins: Object.freeze(["typescript", "jsx", "topLevelAwait"]),
});

export function createRepositoryAstCache({ read = readFile, parseSource = parse } = {}) {
  const asts = new Map();

  return function parseRepositoryAst(root, file, options) {
    const key = JSON.stringify([resolve(root), file, options]);
    if (!asts.has(key))
      asts.set(
        key,
        Promise.resolve(read(join(root, file), "utf8")).then((source) =>
          parseSource(source, options),
        ),
      );
    return asts.get(key);
  };
}
