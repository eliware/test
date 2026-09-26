import { parse } from "@babel/parser";
import { analyzeKnitScriptAst } from "./analyze-knit-script-ast.mjs";

export function parseKnitScript(content, parsedAst = null) {
  let ast = parsedAst;
  try {
    ast ??= parse(content, { sourceType: "module", plugins: ["importAttributes", "topLevelAwait"] });
  } catch (error) {
    return { error: `Knit validation script is not valid JavaScript: ${error.message}`, calls: [] };
  }
  return analyzeKnitScriptAst(ast);
}
