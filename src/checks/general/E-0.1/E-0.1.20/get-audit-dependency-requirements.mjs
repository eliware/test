export function getAuditDependencyRequirements(packageJson) {
  const sections = {
    prod: ["dependencies"],
    dev: ["devDependencies"],
    optional: ["optionalDependencies"],
  };
  const allCategories = Object.fromEntries(
    Object.entries(sections).map(([category, fields]) => [
      category,
      fields.reduce((total, field) => total + Object.keys(packageJson?.[field] ?? {}).length, 0),
    ]),
  );
  const bundled = packageJson?.bundleDependencies ?? packageJson?.bundledDependencies ?? [];
  const peerDependencies = Object.keys(packageJson?.peerDependencies ?? {});
  const dependencyNames = [
    ...Object.values(sections).flatMap((fields) =>
      fields.flatMap((field) => Object.keys(packageJson?.[field] ?? {})),
    ),
    ...peerDependencies,
    ...bundled,
  ];

  return {
    minimumDependencyCount: new Set(dependencyNames).size,
    categories: Object.fromEntries(Object.entries(allCategories).filter(([, count]) => count > 0)),
  };
}
