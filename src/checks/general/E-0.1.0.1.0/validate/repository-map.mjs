import { loadRepoMapRecord } from "../load-repo-map/record.mjs";
import { compareRepoMapRecord } from "./compare-repo-map-record.mjs";

export async function validateRepositoryMap(root, packageJson) {
  const map = await loadRepoMapRecord(root, packageJson);
  return [...(map.error ? [map.error] : []), ...compareRepoMapRecord(packageJson, map)];
}
