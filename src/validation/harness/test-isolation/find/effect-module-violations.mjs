import { visitAst } from "../../visit-ast.mjs";
import { isModuleMockedForLoad } from "../../test-write-policy/collect-mocked-modules.mjs";

const effectModule =
  /^(?:node:)?(?:fs(?:\/promises)?|process|child_process|net|tls|dgram|dns|undici|ws|node-fetch|axios|got)$/u;

export function findEffectModuleViolations(ast) {
  const findings = [];
  visitAst(ast, (node) => {
    const moduleName = readModuleName(node);
    if (
      moduleName &&
      effectModule.test(moduleName) &&
      !isModuleMockedForLoad(ast, moduleName, node)
    )
      findings.push(`must mock effect module ${moduleName} or inject its dependency.`);
  });
  return [...new Set(findings)];
}

function readModuleName(node) {
  if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type))
    return node.source?.value;
  if (node.type === "ImportExpression") return node.source?.value;
  if (
    node.type === "CallExpression" &&
    ["require", "import"].includes(node.callee?.name) &&
    node.arguments[0]?.type === "StringLiteral"
  )
    return node.arguments[0].value;
  return null;
}
