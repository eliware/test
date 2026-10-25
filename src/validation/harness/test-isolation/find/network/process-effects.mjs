import { visitAst } from "../../../visit-ast.mjs";

export function findProcessEffectViolations(ast) {
  const findings = [];
  const aliases = collectProcessAliases(ast);
  visitAst(ast, (node) => {
    if (isDirectProcessEffect(node, aliases.processObjects, aliases.processMethods))
      findings.push("must mock process effects or inject the process dependency.");
  });
  return [...new Set(findings)];
}

function collectProcessAliases(ast) {
  const aliases = { processObjects: new Set(), processMethods: new Set() };
  visitAst(ast, (node) => {
    if (node.type !== "VariableDeclarator" || node.id?.type !== "Identifier") return;
    if (node.init?.name === "process") aliases.processObjects.add(node.id.name);
    if (node.init?.object?.name === "process") aliases.processMethods.add(node.id.name);
  });
  return aliases;
}

function isDirectProcessEffect(node, processObjects, processMethods) {
  if (node.type !== "CallExpression") return false;
  if (node.callee?.type === "Identifier") return processMethods.has(node.callee.name);
  if (node.callee?.type !== "MemberExpression") return false;
  const object = node.callee.object;
  const property = node.callee.computed ? node.callee.property?.value : node.callee.property?.name;
  return (
    (object?.name === "process" || processObjects.has(object?.name)) &&
    ["chdir", "exec", "exit", "kill", "reallyExit"].includes(property)
  );
}
