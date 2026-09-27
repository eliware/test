import { classifyCall } from "./knit-call-analysis.mjs";
import { collectImports } from "./knit-import-analysis.mjs";

const functionTypes = new Set([
  "ArrowFunctionExpression",
  "ClassMethod",
  "ClassPrivateMethod",
  "FunctionDeclaration",
  "FunctionExpression",
  "ObjectMethod",
]);

export function hasUnsupportedKnitChildProcessCall(program, analyzedCalls = []) {
  const imports = collectImports(program);
  const analyzedCallStarts = new Set(analyzedCalls.map(({ start }) => start));
  const visited = new WeakSet();

  function visit(node, insideFunction = false) {
    if (!node || typeof node !== "object" || visited.has(node)) return false;
    visited.add(node);
    if (node.type === "CallExpression" || node.type === "OptionalCallExpression") {
      const { isSubprocess } = classifyCall(node, imports);
      if (isSubprocess && (insideFunction || !analyzedCallStarts.has(node.start))) return true;
    }

    const nestedFunction = insideFunction || functionTypes.has(node.type);
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key)) continue;
      if (Array.isArray(value)) {
        if (value.some((child) => visit(child, nestedFunction))) return true;
      } else if (value && typeof value === "object" && visit(value, nestedFunction)) {
        return true;
      }
    }
    return false;
  }

  return visit(program);
}
