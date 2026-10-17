import { collectJestTestAliases } from "./jest-test-aliases.mjs";

export function collectExecutableJestTestAliases(program, names, blockedDescribes) {
  let changed = true;
  while (changed) changed = visit(program, names, blockedDescribes);
}

function visit(node, names, blockedDescribes, allowFunction = false) {
  if (!node || typeof node !== "object") return false;
  if (isFunction(node)) return allowFunction && visit(node.body, names, blockedDescribes);
  const changed = collectJestTestAliases(node, names);
  const callback = getSuiteCallback(node, names.describes, blockedDescribes);
  let found = changed;
  for (const value of Object.values(node))
    for (const item of Array.isArray(value) ? value : [value])
      found = visit(item, names, blockedDescribes, item === callback) || found;
  return found;
}

function getSuiteCallback(node, describeNames, blockedDescribes) {
  if (node.type !== "CallExpression") return null;
  const callee = node.callee;
  const name =
    callee.type === "Identifier"
      ? callee.name
      : callee.type === "MemberExpression" &&
          (callee.computed ? callee.property.value : callee.property.name) === "only"
        ? callee.object?.name
        : null;
  const callback = node.arguments[1];
  return describeNames.has(name) && !blockedDescribes.has(name) && isFunction(callback)
    ? callback
    : null;
}

function isFunction(node) {
  return ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(
    node?.type,
  );
}
