export function readConventionConfig(packageJson) {
  const apply = packageJson?.eliware?.apply;
  if (!Array.isArray(apply) || apply.length === 0) {
    throw new Error("package.json must define eliware.apply.");
  }
  if (apply.some((group) => typeof group !== "string" || group.length === 0)) {
    throw new Error("eliware.apply must be an array of group names.");
  }
  return { apply };
}
