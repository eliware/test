import { visitAst } from "../../visit-ast.mjs";
import { collectJestSpyCalls } from "./mocks/collect-jest-spy-calls.mjs";

export function findNetworkProcessViolations(ast) {
  const findings = [];
  const aliases = collectAliases(ast);
  const fetchSpies = collectFetchSpies(ast);
  visitAst(ast, (node) => {
    if (isExternalFetch(node, aliases.fetch, fetchSpies))
      findings.push("must mock fetch, inject it, or use a localhost URL.");
    if (isDirectProcessEffect(node, aliases.processObjects, aliases.processMethods))
      findings.push("must mock process effects or inject the process dependency.");
  });
  return [...new Set(findings)];
}

function collectAliases(ast) {
  const aliases = { fetch: new Map(), processObjects: new Set(), processMethods: new Set() };
  visitAst(ast, (node) => {
    if (node.type !== "VariableDeclarator" || node.id?.type !== "Identifier") return;
    if (node.init?.name === "fetch") aliases.fetch.set(node.id.name, node.start);
    if (node.init?.name === "process") aliases.processObjects.add(node.id.name);
    if (node.init?.object?.name === "process") aliases.processMethods.add(node.id.name);
  });
  return aliases;
}

function collectFetchSpies(ast) {
  const spies = [];
  for (const { target, property, position } of collectJestSpyCalls(ast)) {
    if (
      target?.type === "Identifier" &&
      ["global", "globalThis", "window"].includes(target.name) &&
      property === "fetch"
    )
      spies.push({ target: target.name, position });
  }
  return spies;
}

function isExternalFetch(node, aliases, fetchSpies) {
  if (node.type !== "CallExpression") return false;
  const target = fetchTarget(node.callee, aliases);
  if (!target) return false;
  const bindingPosition = aliases.get(node.callee.name);
  const effectivePosition = bindingPosition ?? node.start;
  if (fetchSpies.some((spy) => spy.position < effectivePosition && spyMatches(spy.target, target)))
    return false;
  const url = node.arguments[0];
  if (url?.type !== "StringLiteral") return true;
  try {
    return !["localhost", "127.0.0.1", "::1"].includes(new URL(url.value).hostname);
  } catch {
    return true;
  }
}

function fetchTarget(callee, aliases) {
  if (callee?.name === "fetch") return "globalThis";
  if (aliases.has(callee?.name)) return "globalThis";
  if (
    callee?.type === "MemberExpression" &&
    ["global", "globalThis", "window"].includes(callee.object?.name) &&
    (callee.computed ? callee.property?.value : callee.property?.name) === "fetch"
  )
    return callee.object.name;
  return undefined;
}

function spyMatches(spyTarget, fetchTargetName) {
  if (fetchTargetName === "globalThis") return ["global", "globalThis"].includes(spyTarget);
  return spyTarget === fetchTargetName;
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
