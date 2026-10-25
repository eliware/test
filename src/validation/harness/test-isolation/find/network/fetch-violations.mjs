import { visitAst } from "../../../visit-ast.mjs";
import { collectJestSpyCalls } from "../mocks/collect-jest-spy-calls.mjs";

export function findFetchViolations(ast) {
  const findings = [];
  const aliases = collectFetchAliases(ast);
  const fetchSpies = collectFetchSpies(ast);
  visitAst(ast, (node) => {
    if (isExternalFetch(node, aliases, fetchSpies))
      findings.push("must mock fetch, inject it, or use a localhost URL.");
  });
  return [...new Set(findings)];
}

function collectFetchAliases(ast) {
  const aliases = new Map();
  visitAst(ast, (node) => {
    if (
      node.type === "VariableDeclarator" &&
      node.id?.type === "Identifier" &&
      node.init?.name === "fetch"
    )
      aliases.set(node.id.name, node.start);
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
    const hostname = new URL(url.value).hostname.replace(/^\[|\]$/gu, "");
    return !["localhost", "127.0.0.1", "::1"].includes(hostname);
  } catch {
    return true;
  }
}

function fetchTarget(callee, aliases) {
  if (callee?.name === "fetch" || aliases.has(callee?.name)) return "globalThis";
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
