import visitAst from "../../visit-ast.mjs";
export default function collectMockedModules(ast) {
  const modules = new Set();
  visitAst(ast, (node) => {
    const callee = node.type === "CallExpression" ? node.callee : null;
    const property = callee?.property;
    if (
      callee?.type === "MemberExpression" &&
      callee.object?.name === "jest" &&
      ["mock", "doMock", "unstable_mockModule"].includes(
        callee.computed ? property?.value : property?.name,
      ) &&
      node.arguments[0]?.type === "StringLiteral"
    )
      modules.add(node.arguments[0].value);
  });
  return modules;
}
