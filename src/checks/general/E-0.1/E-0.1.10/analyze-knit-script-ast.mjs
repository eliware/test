import { collectCalls } from "./knit-ast-traversal.mjs";
import { collectImports } from "./knit-import-analysis.mjs";
import { hasLeadingKnitExecutableCode } from "./has-leading-knit-executable-code.mjs";

export function analyzeKnitScriptAst(ast) {
  const calls = [];
  const imports = collectImports(ast.program);
  collectCalls(ast.program, new Map(), imports, calls);
  const orderedCalls = calls.sort((left, right) => left.start - right.start);
  const firstCommand = orderedCalls[0]?.start ?? Number.POSITIVE_INFINITY;
  const leadingExecutable = hasLeadingKnitExecutableCode(ast.program, firstCommand);
  return { calls: orderedCalls, leadingExecutable };
}
