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
  return { direct, namespace, member, isSubprocess };
}
