import { bindPattern, staticValue } from "./knit-static-values.mjs";
import { classifyCall } from "./knit-call-analysis.mjs";

export function collectCalls(node, bindings, imports, calls, unsupported) {
  if (!node || typeof node !== "object") return;
  if (node.type === "ForOfStatement") {
    const values = staticValue(node.right, bindings);
    if (Array.isArray(values)) {
      for (const value of values) {
        const loopBindings = new Map(bindings);
        if (node.left.type === "VariableDeclaration")
          bindPattern(node.left.declarations[0].id, value, loopBindings);
        collectCalls(node.body, loopBindings, imports, calls, unsupported);
      }
    } else {
      unsupported.push(node.start);
      collectCalls(node.body, bindings, imports, calls, unsupported);
    }
    return;
  }
  if (node.type === "VariableDeclaration") {
    for (const declaration of node.declarations) {
      if (declaration.id.type === "Identifier") {
        const value = staticValue(declaration.init, bindings);
        if (value !== undefined) bindings.set(declaration.id.name, value);
      }
    }
  }
  if (node.type === "CallExpression") {
    const classification = classifyCall(node, imports);
    if (classification.isSubprocess) {
      const kind = classification.direct ?? classification.member;
      const command = staticValue(node.arguments[0], bindings);
      const args = kind !== "exec" && kind !== "execSync" ? staticValue(node.arguments[1], bindings) : [];
      calls.push({ kind, command, args, start: node.start });
    }
    if (classification.isSideEffect || classification.isUnsupported || classification.isDynamic)
      unsupported.push(node.start);
  }
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "start", "end"].includes(key)) continue;
    if (Array.isArray(value)) value.forEach((child) => collectCalls(child, bindings, imports, calls, unsupported));
    else if (value && typeof value === "object") collectCalls(value, bindings, imports, calls, unsupported);
  }
}
