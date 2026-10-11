import { collectBindingNames } from "./collect-binding-names.mjs";

export function collectShadowedJestNames(fn, names, callbackNames) {
  const shadowed = { tests: new Set(), callbacks: new Set(), describes: new Set() };
  for (const parameter of fn.params ?? [])
    for (const name of collectBindingNames(parameter))
      addShadow(name, shadowed, names, callbackNames);
  visit(fn.body?.body ?? fn.body);
  return shadowed;

  function visit(node, nestedBlock = false) {
    if (Array.isArray(node)) return node.forEach((item) => visit(item, nestedBlock));
    if (!node || typeof node !== "object") return;
    if (node.type === "BlockStatement") return visit(node.body, true);
    // codescope ignore this because local describe names are blocked before nested traversal stops.
    if (node.type === "FunctionDeclaration" && node.id?.name) {
      // codescope ignore this because the block visitor collects declarations from nested blocks.
      if (nestedBlock) return;
      if (names.callbacks.has(node.id.name) || names.namespaces.has(node.id.name))
        shadowed.tests.add(node.id.name);
      if (names.describes?.has(node.id.name)) shadowed.describes.add(node.id.name);
      return;
    }
    if (isFunction(node)) return;
    if (node.type === "VariableDeclarator") {
      for (const name of collectBindingNames(node.id)) {
        if (isFunction(node.init)) {
          if (names.callbacks.has(name) || names.namespaces.has(name)) shadowed.tests.add(name);
          if (names.describes?.has(name)) shadowed.describes.add(name);
        } else addShadow(name, shadowed, names, callbackNames);
      }
    }
    if (node.type === "AssignmentExpression" && node.left?.type === "Identifier") {
      if (names.callbacks.has(node.left.name) || names.namespaces.has(node.left.name))
        shadowed.tests.add(node.left.name);
      if (callbackNames.has(node.left.name)) shadowed.callbacks.add(node.left.name);
      if (names.describes?.has(node.left.name)) shadowed.describes.add(node.left.name);
    }
    Object.values(node).forEach((value) => visit(value, nestedBlock));
  }
}

function addShadow(name, shadowed, names, callbackNames) {
  if (names.callbacks.has(name) || names.namespaces.has(name)) shadowed.tests.add(name);
  if (callbackNames.has(name)) shadowed.callbacks.add(name);
  if (names.describes?.has(name)) shadowed.describes.add(name);
}

function isFunction(node) {
  return ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(
    node?.type,
  );
}
