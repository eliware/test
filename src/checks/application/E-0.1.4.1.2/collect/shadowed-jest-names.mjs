import { collectBindingNames } from "./binding-names.mjs";
import { addShadowedJestDescribe } from "./shadowed-jest-names/describe.mjs";

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
    if (node.type === "FunctionDeclaration" && node.id?.name) {
      if (nestedBlock) return;
      if (names.callbacks.has(node.id.name) || names.namespaces.has(node.id.name))
        shadowed.tests.add(node.id.name);
      addShadowedJestDescribe(node.id.name, shadowed, names);
      return;
    }
    if (isFunction(node)) return;
    if (node.type === "VariableDeclarator") {
      for (const name of collectBindingNames(node.id)) {
        if (isFunction(node.init)) {
          if (names.callbacks.has(name) || names.namespaces.has(name)) shadowed.tests.add(name);
          addShadowedJestDescribe(name, shadowed, names);
        } else addShadow(name, shadowed, names, callbackNames);
      }
    }
    if (node.type === "AssignmentExpression" && node.left?.type === "Identifier") {
      if (names.callbacks.has(node.left.name) || names.namespaces.has(node.left.name))
        shadowed.tests.add(node.left.name);
      if (callbackNames.has(node.left.name)) shadowed.callbacks.add(node.left.name);
      addShadowedJestDescribe(node.left.name, shadowed, names);
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
