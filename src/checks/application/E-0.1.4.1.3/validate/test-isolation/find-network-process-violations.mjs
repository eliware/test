import { visitAst } from "./visit-ast.mjs";

export function findNetworkProcessViolations(ast, source) {
  const findings = [];
  const aliases = collectAliases(ast);
  visitAst(ast, (node) => {
    if (isExternalFetch(node, source, aliases.fetch))
      findings.push("must mock fetch, inject it, or use a localhost URL.");
    if (isDirectProcessEffect(node, aliases.processObjects, aliases.processMethods))
      findings.push("must mock process effects or inject the process dependency.");
  });
  return [...new Set(findings)];
}

function collectAliases(ast) {
  const aliases = { fetch: new Set(), processObjects: new Set(), processMethods: new Set() };
  visitAst(ast, (node) => {
    if (node.type !== "VariableDeclarator" || node.id?.type !== "Identifier") return;
    if (node.init?.name === "fetch") aliases.fetch.add(node.id.name);
    if (node.init?.name === "process") aliases.processObjects.add(node.id.name);
    if (node.init?.object?.name === "process") aliases.processMethods.add(node.id.name);
  });
  return aliases;
}

function isExternalFetch(node, source, aliases) {
  if (node.type !== "CallExpression" || !isFetchCallee(node.callee, aliases)) return false;
  if (/jest\.spyOn\(\s*(?:globalThis|global)\s*,\s*["']fetch["']\s*\)/u.test(source)) return false;
  const url = node.arguments[0];
  if (url?.type !== "StringLiteral") return true;
  try {
    return !["localhost", "127.0.0.1", "::1"].includes(new URL(url.value).hostname);
  } catch {
    return true;
  }
}

function isFetchCallee(callee, aliases) {
  if (callee?.name === "fetch" || aliases.has(callee?.name)) return true;
  return (
    callee?.type === "MemberExpression" &&
    ["global", "globalThis", "window"].includes(callee.object?.name) &&
    (callee.computed ? callee.property?.value : callee.property?.name) === "fetch"
  );
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
