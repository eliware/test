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
  const member =
    node.callee?.property?.type === "Identifier" ? node.callee.property.name : undefined;
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
          imports.namespaces.has(rootIdentifier(node.callee.object)) ||
          imports.sideEffectNamespaces.has(rootIdentifier(node.callee.object)) ||
          (rootIdentifier(node.callee.object) === "process" &&
            node.callee.property.type === "Identifier" &&
            node.callee.property.name === "cwd")
        )));
  const isDynamic =
    isCall &&
    (node.callee.type === "Import" ||
      (node.callee.type === "Identifier" && ["require", "eval"].includes(node.callee.name)));
  return { direct, namespace, member, isSubprocess, isSideEffect, isUnsupported, isDynamic };
}
