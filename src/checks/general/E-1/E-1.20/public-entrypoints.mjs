function normalizePath(value) {
  return typeof value === "string" ? value.replaceAll("\\", "/").replace(/^\.\//u, "") : value;
}

export function publicEntrypoints(packageJson) {
  const exportMap = packageJson?.exports;
  const values = typeof exportMap === "string" ? [exportMap] : Array.isArray(exportMap) ? exportMap : [];
  if (exportMap && typeof exportMap === "object" && !Array.isArray(exportMap)) {
    const exportRoot = Object.hasOwn(exportMap, ".") ? exportMap["."] : exportMap;
    const collect = (value) => {
      if (typeof value === "string") return [value];
      if (!value || typeof value !== "object") return [];
      return Object.values(value).flatMap(collect);
    };
    values.push(...collect(exportRoot));
  }
  return new Set([packageJson?.main, packageJson?.module, ...values, "src/index.mjs"].map(normalizePath).filter(Boolean));
}
