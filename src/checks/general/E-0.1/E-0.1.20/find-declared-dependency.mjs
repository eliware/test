export function findDeclaredDependency(specifier, declared) {
  if (typeof specifier !== "string") return undefined;
  return declared.find((name) => specifier === name || specifier.startsWith(`${name}/`));
}
