import { matchesWebAssetExclusion } from "./matches-web-asset-exclusion.mjs";

export function findExcludedWebAssets(paths, exclusions) {
  return paths.filter((path) =>
    exclusions.some((exclusion) => matchesWebAssetExclusion(path, exclusion)),
  );
}
