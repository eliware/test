import validateRepoMapMetadata from "./repo-map/metadata.mjs";
export default function compareRepoMapRecord(packageJson, map) {
  if (!map.available || !map.record) return [];
  const message = validateRepoMapMetadata(packageJson, map.record);
  return message ? [message] : [];
}
