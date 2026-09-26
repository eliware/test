import { collectCalls } from "./knit-ast-traversal.mjs";
import { collectImports } from "./knit-import-analysis.mjs";
import { hasLeadingKnitExecutableCode } from "./has-leading-knit-executable-code.mjs";

export function analyzeKnitScriptAst(ast) {
  const calls = [];
  const imports = collectImports(ast.program);
  const unsupported = [...imports.unsupported];
  collectCalls(ast.program, new Map(), imports, calls, unsupported);
  for (const statement of ast.program.body) {
    if (
      (statement.type === "ImportDeclaration" && statement.source.value !== "node:child_process") ||
      ((statement.type === "ExportNamedDeclaration" || statement.type === "ExportAllDeclaration") &&
        statement.source)
    )
      unsupported.push(statement.start);
  }
  const orderedCalls = calls.sort((left, right) => left.start - right.start);
  const firstCommand = orderedCalls[0]?.start ?? Number.POSITIVE_INFINITY;
  const leadingExecutable = hasLeadingKnitExecutableCode(ast.program, firstCommand);
  return { calls: orderedCalls, unsupported: [...new Set(unsupported)], leadingExecutable };
}
