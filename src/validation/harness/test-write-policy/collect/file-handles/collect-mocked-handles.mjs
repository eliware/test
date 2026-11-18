import visitAst from "../../../visit-ast.mjs";
const writeMethods = new Set(["write", "writeFile", "writev"]);
function collectMockedHandles(ast) {
  const mocked = new Set();
  visitAst(ast, (node) => {
    if (node.type === "VariableDeclarator" && isHandleName(node.id?.name)) {
      const properties = node.init?.properties ?? [];
      if (
        properties.some(
          (property) =>
            writeMethods.has(property.key?.name ?? property.key?.value) &&
            property.value?.type === "CallExpression" &&
            property.value.callee?.object?.name === "jest" &&
            property.value.callee?.property?.name === "fn",
        )
      )
        mocked.add(node.id.name);
    }
    if (
      node.type !== "CallExpression" ||
      node.callee?.object?.name !== "jest" ||
      node.callee?.property?.name !== "spyOn"
    )
      return;
    if (isHandleName(node.arguments[0]?.name) && writeMethods.has(node.arguments[1]?.value))
      mocked.add(node.arguments[0].name);
  });
  return mocked;
}
function isHandleName(name) {
  return typeof name === "string" && /^(?:file)?handle$/iu.test(name);
}
export default collectMockedHandles;
