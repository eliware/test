export function findLibraryEntryPoints(packageJson = {}) {
  if (!Array.isArray(packageJson.eliware?.apply) || !packageJson.eliware.apply.includes("library")) return [];
  const exportsRoot = packageJson.exports?.["."] ?? packageJson.exports;
  const targets = [];
  const collect = (value) => {
    if (typeof value === "string") {
      if (value.startsWith("./")) targets.push(value.slice(2));
      return;
    }
    if (value && typeof value === "object") Object.values(value).forEach(collect);
  };
  collect(exportsRoot);
  collect(packageJson.main);
  collect(packageJson.module);
  return targets;
}
