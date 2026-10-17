import { collectBindingNames } from "./binding-names.mjs";

const nestedScopes = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
  "ClassDeclaration",
  "ClassExpression",
]);

export function collectHoistedVarNames(node, add) {
  if (!node || typeof node !== "object") return;
  if (nestedScopes.has(node.type)) return;
  if (node.type === "VariableDeclaration") {
    if (node.kind === "var")
      node.declarations.forEach((item) =>
        collectBindingNames(item.id).forEach((name) => add(name, item.init)),
      );
    return;
  }
  Object.values(node).forEach((value) => {
    if (Array.isArray(value)) value.forEach((item) => collectHoistedVarNames(item, add));
    else collectHoistedVarNames(value, add);
  });
}
