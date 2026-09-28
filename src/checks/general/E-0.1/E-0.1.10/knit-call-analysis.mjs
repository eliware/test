import { identifierOrMemberRoot } from "./knit-member-chain.mjs";

export const subprocessFunctions = new Set([
  "exec",
  "execFile",
  "execFileSync",
  "execSync",
  "spawn",
  "spawnSync",
]);
const callExpressionTypes = new Set(["CallExpression", "OptionalCallExpression"]);
const memberExpressionTypes = new Set(["MemberExpression", "OptionalMemberExpression"]);

export function rootIdentifier(node) {
  return identifierOrMemberRoot(node);
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
      (memberExpressionTypes.has(node.callee.type) &&
        !(
          (imports.namespaces.has(namespace) && subprocessFunctions.has(member)) ||
          imports.sideEffectNamespaces.has(rootIdentifier(node.callee.object)) ||
          (rootIdentifier(node.callee.object) === "process" && member === "cwd")
        )));
  const isDynamic =
    isCall &&
    (node.callee.type === "Import" ||
      (node.callee.type === "Identifier" && ["require", "eval"].includes(node.callee.name)) ||
      (memberExpressionTypes.has(node.callee.type) &&
        node.callee.object?.type === "MetaProperty" &&
        node.callee.property?.name === "require"));
  return { direct, namespace, member, isSubprocess, isSideEffect, isUnsupported, isDynamic };
}
