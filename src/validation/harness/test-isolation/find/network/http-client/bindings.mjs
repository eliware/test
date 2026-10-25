import { visitAst } from "../../../../visit-ast.mjs";

const methods = new Set(["get", "request"]);
const modules = new Set(["http", "https", "node:http", "node:https"]);

export function collectHttpBindings(ast) {
  const bindings = new Map();
  visitAst(ast, (node) => {
    if (node.type === "ImportDeclaration") {
      addBindings(node.source.value, node.specifiers, bindings);
      return;
    }
    if (node.type === "VariableDeclarator")
      addBindings(readModuleName(node.init), [node], bindings);
  });
  return bindings;
}

function addBindings(moduleName, specifiers, bindings) {
  if (!modules.has(moduleName)) return;
  for (const item of specifiers) {
    if (item.type === "ImportSpecifier") {
      if (methods.has(item.imported.name ?? item.imported.value))
        bindings.set(item.local.name, moduleName);
    } else if (item.id?.type === "ObjectPattern") {
      for (const property of item.id.properties) {
        if (methods.has(property.key.name ?? property.key.value))
          bindings.set(property.value.name, moduleName);
      }
    } else if (item.id?.type === "Identifier") bindings.set(item.id.name, moduleName);
    else if (item.local?.name) bindings.set(item.local.name, moduleName);
  }
}

function readModuleName(node) {
  const expression = node?.type === "AwaitExpression" ? node.argument : node;
  if (expression?.type === "ImportExpression") return expression.source.value;
  if (expression?.type === "CallExpression" && expression.callee?.name === "require")
    return expression.arguments[0]?.value;
  return undefined;
}
