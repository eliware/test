export const subprocessFunctions = new Set([
  "exec",
  "execFile",
  "execFileSync",
  "execSync",
  "spawn",
  "spawnSync",
]);
const callExpressionTypes = new Set(["CallExpression", "OptionalCallExpression"]);

export function rootIdentifier(node) {
  let current = node;
  while (current?.type === "MemberExpression") current = current.object;
  return current?.type === "Identifier" ? current.name : undefined;
}

export function classifyCall(node, imports) {
  const direct =
    node.callee?.type === "Identifier" ? imports.names.get(node.callee.name) : undefined;
  const namespace = rootIdentifier(node.callee?.object);
  const property = node.callee?.property;
  const member =
    property?.type === "Identifier"
      ? property.name
      : node.callee?.computed && property?.type === "StringLiteral"
        ? property.value
        : undefined;
  const isCall = callExpressionTypes.has(node.type);
  const isSubprocess = Boolean(
    isCall &&
    ((node.callee.type === "Identifier" && subprocessFunctions.has(direct)) ||
      (namespace && imports.namespaces.has(namespace) && subprocessFunctions.has(member))),
  );
  const isSideEffect =
    isCall &&
    ((direct && direct.includes(":")) ||
      (namespace && imports.sideEffectNamespaces.has(namespace)));
  const isUnsupported =
    isCall &&
    ((node.callee.type === "Identifier" && !imports.names.has(node.callee.name)) ||
      (node.callee.type === "MemberExpression" &&
        !(
          (imports.namespaces.has(namespace) && subprocessFunctions.has(member)) ||
          imports.sideEffectNamespaces.has(rootIdentifier(node.callee.object)) ||
          (rootIdentifier(node.callee.object) === "process" &&
            member === "cwd")
        )));
  const isDynamic =
    isCall &&
    (node.callee.type === "Import" ||
      (node.callee.type === "Identifier" && ["require", "eval"].includes(node.callee.name)));
  return { direct, namespace, member, isSubprocess, isSideEffect, isUnsupported, isDynamic };
}
