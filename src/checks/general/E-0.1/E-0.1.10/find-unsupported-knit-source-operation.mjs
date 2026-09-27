import { memberChain } from "./knit-member-chain.mjs";
import {
  effectGlobals,
  networkOperations,
  processOperations,
  sideEffectRoots,
} from "./knit-source-operation-policy.mjs";

export function hasUnsupportedKnitSourceOperation(program, { namespaces, importedOperations }) {
  let unsupported = false;
  const visited = new WeakSet();
  function visit(node) {
    if (!node || unsupported || visited.has(node)) return;
    visited.add(node);
    if (node.type === "CallExpression" || node.type === "OptionalCallExpression") {
      const callee = node.callee;
      if (
        callee.type === "Identifier" &&
        isUnsupportedIdentifier(callee.name, importedOperations)
      ) {
        unsupported = true;
        return;
      }
      if (callee.type === "MemberExpression" || callee.type === "OptionalMemberExpression") {
        if (isUnsupportedMember(callee, namespaces)) {
          unsupported = true;
          return;
        }
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  }
  visit(program);
  return unsupported;
}

function isUnsupportedIdentifier(name, importedOperations) {
  return (
    importedOperations.has(name) ||
    effectGlobals.has(name) ||
    processOperations.has(name) ||
    networkOperations.has(name)
  );
}

function isUnsupportedMember(callee, namespaces) {
  const { root, names } = memberChain(callee);
  return (
    namespaces.has(root) ||
    sideEffectRoots.has(root) ||
    (root === "process" &&
      (names.includes(undefined) ||
        names.some(
          (name) =>
            processOperations.has(name) || networkOperations.has(name) || name === "require",
        ))) ||
    (root === "globalThis" &&
      (names.includes(undefined) ||
        names.some((name) => networkOperations.has(name) || name === "require")))
  );
}
