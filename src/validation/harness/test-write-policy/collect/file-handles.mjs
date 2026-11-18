import visitAst from "../../visit-ast.mjs";
export default function collectFileHandles(ast) {
  const names = new Set();
  visitAst(ast, (node) => {
    if (isFunction(node)) node.params.forEach((param) => addHandle(param, names));
    if (node.type === "VariableDeclarator" && isHandleName(node.id?.name)) names.add(node.id.name);
  });
  return names;
}
function addHandle(param, names) {
  if (param.type === "Identifier" && isHandleName(param.name)) names.add(param.name);
}
function isFunction(node) {
  return ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(
    node.type,
  );
}
function isHandleName(name) {
  return typeof name === "string" && /^(?:file)?handle$/iu.test(name);
}
