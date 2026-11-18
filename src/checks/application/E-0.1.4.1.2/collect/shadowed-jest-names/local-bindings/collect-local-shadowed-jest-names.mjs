import collectBindingNames from "../../binding-names.mjs";
import addShadowedJestDescribe from "../describe.mjs";
import addShadowedJestName from "../local-bindings.mjs";
function collectLocalShadowedJestNames(node, names, callbackNames, shadowed) {
  visit(node);
  function visit(current, nestedBlock = false) {
    if (Array.isArray(current)) return current.forEach((item) => visit(item, nestedBlock));
    if (!current || typeof current !== "object") return;
    if (current.type === "BlockStatement") return visit(current.body, true);
    if (current.type === "FunctionDeclaration" && current.id?.name) {
      if (nestedBlock) return;
      if (names.callbacks.has(current.id.name) || names.namespaces.has(current.id.name))
        shadowed.tests.add(current.id.name);
      addShadowedJestDescribe(current.id.name, shadowed, names);
      return;
    }
    if (isFunction(current)) return;
    if (current.type === "VariableDeclarator") {
      for (const name of collectBindingNames(current.id)) {
        if (isFunction(current.init)) {
          if (names.callbacks.has(name) || names.namespaces.has(name)) shadowed.tests.add(name);
          addShadowedJestDescribe(name, shadowed, names);
        } else addShadowedJestName(name, shadowed, names, callbackNames);
      }
    }
    if (current.type === "AssignmentExpression" && current.left?.type === "Identifier")
      addShadowedJestName(current.left.name, shadowed, names, callbackNames);
    Object.values(current).forEach((value) => visit(value, nestedBlock));
  }
}
function isFunction(node) {
  return ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(
    node?.type,
  );
}
export default collectLocalShadowedJestNames;
