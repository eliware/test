import visitAst from "../../../visit-ast.mjs";
function isModuleMockedForLoad(ast, moduleName, loadNode) {
  let mocked = false;
  visitAst(ast, (node) => {
    if (!isJestMockCall(node)) return;
    if (!sameModule(node.arguments[0]?.value, moduleName)) return;
    if (mockUsesActualModule(node)) return;
    if (loadNode.type !== "ImportDeclaration" && node.start < loadNode.start) mocked = true;
  });
  return mocked;
}
function isJestMockCall(node) {
  return node.type === "CallExpression" && mockMethod(node) !== undefined;
}
function mockMethod(node) {
  const callee = node.callee;
  const property = callee?.property;
  if (callee?.type !== "MemberExpression" || callee.object?.name !== "jest") return undefined;
  const method = callee.computed ? property?.value : property?.name;
  return ["mock", "doMock", "unstable_mockModule"].includes(method) ? method : undefined;
}
function mockUsesActualModule(node) {
  const factory = node.arguments[1];
  if (!factory) return false;
  let usesActualModule = false;
  visitAst(factory, (child) => {
    const callee = child.type === "CallExpression" ? child.callee : null;
    if (
      callee?.type === "MemberExpression" &&
      callee.object?.name === "jest" &&
      ["requireActual", "importActual"].includes(callee.property?.name)
    )
      usesActualModule = true;
  });
  return usesActualModule;
}
function sameModule(left, right) {
  return (
    typeof left === "string" &&
    typeof right === "string" &&
    withoutNodePrefix(left) === withoutNodePrefix(right)
  );
}
function withoutNodePrefix(value) {
  return value.startsWith("node:") ? value.slice(5) : value;
}
export default isModuleMockedForLoad;
