import { isAbsolute, relative, resolve, sep } from "node:path";

export function resolveWebAssetSettings(root, packageJson) {
  const assetRoot = typeof packageJson?.eliware?.webRoot === "string" && packageJson.eliware.webRoot.trim()
    ? packageJson.eliware.webRoot.trim()
    : "public";
  const configured = packageJson?.eliware?.webAssetExcludes;
  if (configured !== undefined &&
      (!Array.isArray(configured) || configured.some((value) => typeof value !== "string" || !value.trim()))) {
    return { error: "eliware.webAssetExcludes must be a string array when provided." };
  }
  const resolvedRoot = resolve(root);
  const resolvedAssets = resolve(resolvedRoot, assetRoot);
  const relativeAssets = relative(resolvedRoot, resolvedAssets);
  if (isAbsolute(assetRoot) || !relativeAssets || relativeAssets.startsWith(`..${sep}`) || relativeAssets === "..") {
    return { error: "eliware.webRoot must resolve to a non-root directory inside the repository root." };
  }
  return {
    assetRoot,
    resolvedAssets,
    exclusions: ["dist", "build", "coverage", "node_modules", ".git", ...(configured ?? [])],
  };
}
