import { patternHasRequire } from "./pattern-has-require-binding.mjs";
import { isFunctionNode } from "./is-function-node.mjs";

export function hasFunctionScopedRequire(node) {
  if (!node || typeof node !== "object" || isFunctionNode(node)) return false;
  if (
    node.type === "VariableDeclaration" &&
    node.kind === "var" &&
    node.declarations.some(({ id }) => patternHasRequire(id))
  )
    return true;
  return Object.entries(node).some(
    ([key, value]) =>
      !["loc", "start", "end"].includes(key) &&
      (Array.isArray(value)
        ? value.some(hasFunctionScopedRequire)
        : value && typeof value === "object" && hasFunctionScopedRequire(value)),
  );
}
