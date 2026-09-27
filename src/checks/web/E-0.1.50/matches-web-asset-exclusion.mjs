export function matchesWebAssetExclusion(path, exclusion) {
  const normalizedPath = path.replaceAll("\\", "/");
  const normalizedExclusion = exclusion.trim().replaceAll("\\", "/").replace(/^\.\//u, "").replace(/\/+$/u, "");
  const pattern = normalizedExclusion.replace(/[.+^${}()|[\]\\]/gu, "\\$&").replaceAll("*", ".*");
  return new RegExp(`(?:^|/)${pattern}(?:/|$)`, "u").test(normalizedPath);
}
