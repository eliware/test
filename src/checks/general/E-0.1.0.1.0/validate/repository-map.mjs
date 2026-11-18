import loadRepoMapRecord from "../load-repo-map/record.mjs";
import compareRepoMapRecord from "./compare-repo-map-record.mjs";
export default async function validateRepositoryMap(root, packageJson) {
  const map = await loadRepoMapRecord(root, packageJson);
  const errors = [...(map.error ? [map.error] : []), ...compareRepoMapRecord(packageJson, map)];
  if (
    map.sourceHash &&
    errors.some((error) => error.startsWith("The package exemption list must match repo-map.yaml."))
  ) {
    errors.push(`repo-map.yaml path: ${map.sourcePath}`);
    errors.push(`repo-map.yaml SHA-256: ${map.sourceHash}`);
  }
  return errors;
}
