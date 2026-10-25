export function isOptionalPeer(entry, name) {
  const details = entry.peerDependenciesMeta?.[name];
  return (
    details !== null &&
    typeof details === "object" &&
    !Array.isArray(details) &&
    details.optional === true
  );
}
