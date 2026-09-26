import { bindPattern, staticValue } from "./knit-static-values.mjs";
import { classifyCall } from "./knit-call-analysis.mjs";

export function collectCalls(node, bindings, imports, calls, unsupported) {
  if (!node || typeof node !== "object") return;
  if (node.type === "BlockStatement") {
    const blockBindings = new Map(bindings);
    const blockDeclarations = new Set(
      node.body.flatMap((statement) =>
        statement.type === "VariableDeclaration"
          ? statement.declarations.flatMap((declaration) =>
              declaration.id.type === "Identifier" ? [declaration.id.name] : [],
            )
          : [],
      ),
    );
    for (const statement of node.body) {
      collectCalls(statement, blockBindings, imports, calls, unsupported);
    }
    for (const [name, value] of bindings) {
      if (blockDeclarations.has(name)) continue;
      if (!blockBindings.has(name) || blockBindings.get(name) !== value) bindings.delete(name);
    }
    return;
  }
  if (node.type === "AssignmentExpression" || node.type === "UpdateExpression") {
    const target = node.type === "AssignmentExpression" ? node.left : node.argument;
    const reportsSubprocessStatus =
      node.type === "AssignmentExpression" &&
      target?.type === "MemberExpression" &&
      target.object?.type === "Identifier" &&
      target.object.name === "process" &&
      target.property?.type === "Identifier" &&
      target.property.name === "exitCode";
    if (!reportsSubprocessStatus) {
      if (target?.type === "Identifier") bindings.delete(target.name);
      unsupported.push(node.start);
    }
  }
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
  if (node.type === "CallExpression" || node.type === "OptionalCallExpression") {
    const classification = classifyCall(node, imports);
    if (classification.isSubprocess) {
      const kind = classification.direct ?? classification.member;
      const command = staticValue(node.arguments[0], bindings);
      const args =
        kind !== "exec" && kind !== "execSync" ? staticValue(node.arguments[1], bindings) : [];
      calls.push({ kind, command, args, start: node.start });
    }
    if (
      classification.isSideEffect ||
      classification.isUnsupported ||
      classification.isDynamic ||
      (node.callee.type === "Identifier" && !classification.isSubprocess)
    )
      unsupported.push(node.start);
  }
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "start", "end"].includes(key)) continue;
    if (Array.isArray(value))
      value.forEach((child) => collectCalls(child, bindings, imports, calls, unsupported));
    else if (value && typeof value === "object")
      collectCalls(value, bindings, imports, calls, unsupported);
  }
}
