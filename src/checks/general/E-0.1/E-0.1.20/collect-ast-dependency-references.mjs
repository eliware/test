import { collectRequireBindingScopes } from "./collect-require-binding-scopes.mjs";
import { classifyAstDependencyReference } from "./classify-ast-dependency-reference.mjs";

export function collectAstReferences(
  node,
  declared,
  referenced,
  uncertain = { value: false },
  collectScopes = collectRequireBindingScopes,
) {
  if (!node || typeof node !== "object") return;
  const requireBindingScopes = collectScopes(node);
  // codescope ignore: requireShadowed is propagated into classifyStaticAstDependencyReference, which skips require.resolve calls in a shadowed lexical scope
  collectAstNodeReferences(node, declared, referenced, uncertain, false, requireBindingScopes);
}

function collectAstNodeReferences(
  node,
  declared,
  referenced,
  uncertain,
  requireShadowed,
  requireBindingScopes,
) {
  if (!node || typeof node !== "object") return;
  requireShadowed ||= requireBindingScopes.has(node);
  classifyAstDependencyReference(node, declared, referenced, uncertain, requireShadowed);
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "start", "end"].includes(key)) continue;
    if (Array.isArray(value))
      value.forEach((child) =>
        collectAstNodeReferences(
          child,
          declared,
          referenced,
          uncertain,
          requireShadowed,
          requireBindingScopes,
        ),
      );
    else if (value && typeof value === "object")
      collectAstNodeReferences(
        value,
        declared,
        referenced,
        uncertain,
        requireShadowed,
        requireBindingScopes,
      );
  }
}
