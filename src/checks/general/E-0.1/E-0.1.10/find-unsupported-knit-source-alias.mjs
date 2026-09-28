import { identifierOrMemberRoot } from "./knit-member-chain.mjs";
import {
  effectGlobals,
  networkOperations,
  processOperations,
} from "./knit-source-operation-policy.mjs";

const globalScopeAliases = new Set(["global", "globalThis", "process", "self", "window"]);

export function hasUnsupportedKnitSourceAlias(node, importedBindings = null) {
  const visited = new WeakSet();
  return containsUnsupportedAlias(node);

  function containsUnsupportedAlias(node) {
    if (!node || typeof node !== "object" || visited.has(node)) return false;
    visited.add(node);
    if (node.type === "VariableDeclaration") {
      for (const declaration of node.declarations) {
        const source = identifierOrMemberRoot(declaration.init);
        if (
          source &&
          (importedBindings?.namespaces.has(source) ||
            importedBindings?.importedOperations.has(source))
        )
          return true;
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
            operation === "require" ||
            (source === "globalThis" && globalScopeAliases.has(operation))
          )
            return true;
        }
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key)) continue;
      if (Array.isArray(value)) {
        if (value.some(containsUnsupportedAlias)) return true;
      } else if (value && typeof value === "object" && containsUnsupportedAlias(value)) return true;
    }
    return false;
  }
}
