import { visitAst } from "../../../visit-ast.mjs";
import { collectMockedModules } from "../../../test-write-policy/collect-mocked-modules.mjs";
import { collectHttpBindings, collectMockedClients } from "./bindings.mjs";
import { isInjectedHttpClient, targetsLocalhost } from "./targets.mjs";

export function findHttpClientViolations(ast) {
  const bindings = collectHttpBindings(ast);
  const mocks = collectMockedModules(ast);
  const mockedClients = collectMockedClients(ast);
  const findings = [];
  visitAst(ast, (node) => {
    if (!isRequestCall(node)) return;
    const moduleName = getModuleName(node.callee, bindings);
    if (mocks.has(moduleName)) return;
    if (mockedClients.has(rootName(node.callee.object))) return;
    if (
      (moduleName || isInjectedHttpClient(node.callee.object)) &&
      !targetsLocalhost(node.arguments[0])
    )
      findings.push(
        "must mock HTTP client requests, inject a mock client, or use a localhost URL.",
      );
  });
  return [...new Set(findings)];
}

function isRequestCall(node) {
  return node.type === "CallExpression" && ["get", "request"].includes(memberName(node.callee));
}

function getModuleName(callee, bindings) {
  return bindings.get(rootName(callee.object)) ?? bindings.get(callee.name);
}

function memberName(node) {
  return node?.type === "MemberExpression" || node?.type === "OptionalMemberExpression"
    ? node.computed
      ? node.property.value
      : node.property.name
    : node?.name;
}

function rootName(node) {
  if (node?.type === "Identifier") return node.name;
  if (["MemberExpression", "OptionalMemberExpression"].includes(node?.type))
    return rootName(node.object);
  return undefined;
}
