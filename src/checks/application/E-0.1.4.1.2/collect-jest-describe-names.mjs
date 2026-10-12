export function collectJestDescribeNames(program) {
  const names = new Set(["describe", "context"]);
  for (const node of program.body) {
    if (node.type !== "ImportDeclaration" || node.source.value !== "@jest/globals") continue;
    for (const specifier of node.specifiers)
      if (
        specifier.type === "ImportSpecifier" &&
        ["describe", "context"].includes(specifier.imported.name)
      )
        names.add(specifier.local.name);
  }
  return names;
}
