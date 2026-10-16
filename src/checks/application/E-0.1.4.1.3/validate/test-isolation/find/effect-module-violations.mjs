import { visitAst } from "../visit-ast.mjs";

const effectModule =
  /^(?:node:)?(?:fs(?:\/promises)?|process|child_process|http|https|net|tls|dgram|dns|undici|ws|node-fetch|axios|got)$/u;

export function findEffectModuleViolations(ast) {
  const mocked = collectMockedModules(ast);
  const findings = [];
  visitAst(ast, (node) => {
    const moduleName = readModuleName(node);
    if (moduleName && effectModule.test(moduleName) && !mocked.has(moduleName))
      findings.push(`must mock effect module ${moduleName} or inject its dependency.`);
  });
  return [...new Set(findings)];
}

function collectMockedModules(ast) {
  const mocked = new Set();
  visitAst(ast, (node) => {
    if (!isJestMockCall(node)) return;
    const value = node.arguments[0];
    if (value?.type === "StringLiteral") mocked.add(value.value);
  });
  return mocked;
}

function isJestMockCall(node) {
  const callee = node.type === "CallExpression" ? node.callee : null;
  const property = callee?.property;
  return (
    callee?.type === "MemberExpression" &&
    callee.object?.name === "jest" &&
    ["mock", "doMock", "unstable_mockModule"].includes(
      callee.computed ? property?.value : property?.name,
    )
  );
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
