import { identifierOrMemberRoot } from "./knit-member-chain.mjs";
import {
  effectGlobals,
  networkOperations,
  processOperations,
} from "./knit-source-operation-policy.mjs";

export function hasUnsupportedKnitSourceAlias(node, visited = new WeakSet()) {
  if (!node || typeof node !== "object" || visited.has(node)) return false;
  visited.add(node);
  if (node.type === "VariableDeclaration") {
    for (const declaration of node.declarations) {
      const source = identifierOrMemberRoot(declaration.init);
      if (!source || !effectGlobals.has(source)) continue;
      if (declaration.id.type === "Identifier" || declaration.id.type !== "ObjectPattern")
        return true;
      for (const property of declaration.id.properties) {
        if (property.type === "RestElement") return true;
        if (property.value?.type === "ObjectPattern" || property.value?.type === "ArrayPattern")
          return true;
        const operation = property.computed
          ? property.key.type === "StringLiteral"
            ? property.key.value
            : undefined
          : property.key.name;
        if (
          !operation ||
          processOperations.has(operation) ||
          networkOperations.has(operation) ||
          operation === "require"
        )
          return true;
      }
    }
  }
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key)) continue;
    if (Array.isArray(value)) {
      if (value.some((child) => hasUnsupportedKnitSourceAlias(child, visited))) return true;
    } else if (value && typeof value === "object" && hasUnsupportedKnitSourceAlias(value, visited))
      return true;
  }
  return false;
}
