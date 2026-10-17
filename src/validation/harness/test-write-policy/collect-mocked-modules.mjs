import { visitAst } from "../visit-ast.mjs";

export function collectMockedModules(ast) {
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

export function getRestrictedModuleName(init) {
  if (init?.type === "ImportExpression") return init.source.value;
  if (init?.type === "CallExpression" && init.callee?.name === "require")
    return init.arguments[0]?.value;
  return undefined;
}
