import { staticValue } from "./knit-static-values.mjs";
import { classifyCall } from "./knit-call-analysis.mjs";
import { traverseKnitBindingNode } from "./traverse-knit-binding-node.mjs";

export function collectCalls(node, bindings, imports, calls) {
  if (!node || typeof node !== "object") return;
  const handled = traverseKnitBindingNode(node, bindings, (child, scope) =>
    collectCalls(child, scope, imports, calls),
  );
  if (handled) return;
  if (node.type === "CallExpression" || node.type === "OptionalCallExpression") {
    const classification = classifyCall(node, imports);
    if (classification.isSubprocess) {
      const kind = classification.direct ?? classification.member;
      const command = staticValue(node.arguments[0], bindings);
      const args =
        kind !== "exec" && kind !== "execSync" ? staticValue(node.arguments[1], bindings) : [];
      calls.push({ kind, command, args, start: node.start });
    }
  }
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "start", "end"].includes(key)) continue;
    if (Array.isArray(value))
      value.forEach((child) => collectCalls(child, bindings, imports, calls));
    else if (value && typeof value === "object") collectCalls(value, bindings, imports, calls);
  }
}
