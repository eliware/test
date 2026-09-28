import { bindPattern, staticValue } from "./knit-static-values.mjs";

export function traverseKnitBindingNode(node, bindings, visit) {
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
    for (const statement of node.body) visit(statement, blockBindings);
    for (const [name, value] of bindings) {
      if (blockDeclarations.has(name)) continue;
      if (!blockBindings.has(name) || blockBindings.get(name) !== value) bindings.delete(name);
    }
    return true;
  }

  if (node.type === "AssignmentExpression" || node.type === "UpdateExpression") {
    const target = node.type === "AssignmentExpression" ? node.left : node.argument;
    if (target?.type === "Identifier") bindings.delete(target.name);
  }

  if (node.type === "ForOfStatement") {
    const values = staticValue(node.right, bindings);
    if (Array.isArray(values)) {
      for (const value of values) {
        const loopBindings = new Map(bindings);
        if (node.left.type === "VariableDeclaration") {
          bindPattern(node.left.declarations[0].id, value, loopBindings);
        }
        visit(node.body, loopBindings);
      }
    }
    return true;
  }

  if (node.type === "VariableDeclaration") {
    for (const declaration of node.declarations) {
      if (declaration.id.type === "Identifier") {
        const value = staticValue(declaration.init, bindings);
        if (value !== undefined) bindings.set(declaration.id.name, value);
      }
    }
  }

  return false;
}
