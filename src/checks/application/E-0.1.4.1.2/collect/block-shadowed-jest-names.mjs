import { collectBindingNames } from "./binding-names.mjs";

export function collectBlockShadowedJestNames(block, names, callbackNames) {
  const shadowed = { tests: new Set(), callbacks: new Set(), describes: new Set() };
  for (const statement of block.body) {
    if (statement.type === "VariableDeclaration" && statement.kind !== "var")
      for (const declaration of statement.declarations)
        for (const name of collectBindingNames(declaration.id))
          addShadow(name, shadowed, names, callbackNames, isFunction(declaration.init));
    else if (["FunctionDeclaration", "ClassDeclaration"].includes(statement.type))
      addShadow(statement.id?.name, shadowed, names, callbackNames, true);
  }
  return shadowed;
}

function addShadow(name, shadowed, names, callbackNames, isFunctionBinding) {
  if (!name) return;
  if (names.callbacks.has(name) || names.namespaces.has(name)) shadowed.tests.add(name);
  if (names.describes?.has(name)) shadowed.describes.add(name);
  if (callbackNames.has(name) && !isFunctionBinding) shadowed.callbacks.add(name);
}

function isFunction(node) {
  return ["ArrowFunctionExpression", "FunctionExpression"].includes(node?.type);
}
