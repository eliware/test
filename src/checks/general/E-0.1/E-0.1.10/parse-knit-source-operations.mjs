import { parse } from "@babel/parser";

export function parseKnitSourceOperations(source, parsedAst) {
  return (
    parsedAst?.program ??
    parse(source, {
      sourceType: "module",
      plugins: ["importAttributes", "topLevelAwait"],
      allowUndeclaredExports: true,
    }).program
  );
}
