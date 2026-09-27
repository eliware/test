import { findDeclaredDependency } from "./find-declared-dependency.mjs";
import { mayNameDeclaredDependency } from "./may-name-declared-dependency.mjs";

export function classifyRuntimeAstDependencyReference(
  node,
  declared,
  referenced,
  uncertain,
  requireShadowed,
) {
  const specifier =
    node.type === "ImportExpression"
      ? node.source
      : node.callee?.type === "Import" || node.callee?.name === "require"
        ? node.arguments?.[0]
        : undefined;
  const isRequire = node.type === "CallExpression" && node.callee?.name === "require";
  if (!specifier || (isRequire && requireShadowed)) return;
  if (specifier.type === "StringLiteral") {
    const dependency = findDeclaredDependency(specifier.value, declared);
    if (dependency) referenced.add(dependency);
  } else if (mayNameDeclaredDependency(specifier, declared)) {
    uncertain.value = true;
  }
}
