import { visitAst } from "../../../visit-ast.mjs";

export function collectJestSpyCalls(ast) {
  const spies = [];
  visitAst(ast, (node) => {
    if (node.type !== "CallExpression") return;
    const callee = node.callee;
    if (callee?.type !== "MemberExpression" || callee.object?.name !== "jest") return;
    const method = callee.computed ? callee.property?.value : callee.property?.name;
    if (method !== "spyOn") return;
    spies.push({
      method,
      target: node.arguments[0],
      property: node.arguments[1]?.value,
      position: node.start,
    });
  });
  return spies;
}
