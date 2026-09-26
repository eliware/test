import { parse } from "@babel/parser";
import { collectCalls } from "./knit-ast-traversal.mjs";
import { collectImports } from "./knit-import-analysis.mjs";

export function parseKnitScript(content) {
  let ast;
  try {
    ast = parse(content, { sourceType: "module", plugins: ["importAttributes", "topLevelAwait"] });
  } catch (error) {
    return { error: `Knit validation script is not valid JavaScript: ${error.message}`, calls: [] };
  }
  const calls = [];
  const unsupported = [];
  collectCalls(ast.program, new Map(), collectImports(ast.program), calls, unsupported);
  for (const statement of ast.program.body) {
    if (statement.type === "ImportDeclaration" && statement.source.value !== "node:child_process")
      unsupported.push(statement.start);
  }
  const orderedCalls = calls.sort((left, right) => left.start - right.start);
  const firstCommand = orderedCalls[0]?.start ?? Number.POSITIVE_INFINITY;
  const leadingExecutable = ast.program.body.some(
    (statement) => statement.start < firstCommand && statement.type === "ExpressionStatement",
  );
  return { calls: orderedCalls, unsupported: [...new Set(unsupported)], leadingExecutable };
}

export function commandTokens(call) {
  if (typeof call.command !== "string" || !Array.isArray(call.args)) return null;
  return [call.command, ...call.args].every((token) => typeof token === "string")
    ? [call.command, ...call.args]
    : null;
}
