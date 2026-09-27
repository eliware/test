import { findDeclaredDependency } from "./find-declared-dependency.mjs";

export function classifyStaticAstDependencyReference(
  node,
  declared,
  referenced,
  requireShadowed = false,
) {
  const addSpecifier = (specifier) => {
    const dependency = findDeclaredDependency(specifier, declared);
    if (dependency) referenced.add(dependency);
  };
  if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type))
    addSpecifier(node.source?.value);
  if (
    node.type === "CallExpression" &&
    node.callee?.type === "Identifier" &&
    node.callee.name === "resolvePackage"
  )
    addSpecifier(node.arguments?.[0]?.value);
  if (
    node.type === "CallExpression" &&
    !requireShadowed &&
    node.callee?.type === "MemberExpression" &&
    !node.callee.computed &&
    node.callee.object?.type === "Identifier" &&
    node.callee.object.name === "require" &&
    node.callee.property?.type === "Identifier" &&
    node.callee.property.name === "resolve"
  )
    addSpecifier(node.arguments?.[0]?.value);
}
