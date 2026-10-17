import { parse } from "@babel/parser";
import { analyzeTestToolUse } from "./analyze/test-tool-use.mjs";

export function detectTestToolUse(content, allowHarnessTools = false) {
  let ast;
  try {
    ast = parse(content, {
      sourceType: "unambiguous",
      errorRecovery: true,
      plugins: ["jsx", "typescript"],
    });
  } catch {
    return true;
  }
  return analyzeTestToolUse(ast.program, allowHarnessTools);
}
