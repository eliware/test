export function selectPackManifestEntry(manifest, packageName) {
  if (Array.isArray(manifest)) {
    const candidates = packageName
      ? manifest.filter((entry) => entry?.name === packageName)
      : manifest;
    return candidates.length === 1 ? candidates[0] : null;
  }
  if (Array.isArray(manifest?.files)) {
    return !packageName || manifest.name === packageName ? manifest : null;
  }
  if (packageName) {
    const entry = manifest?.[packageName];
    return entry?.name === packageName ? entry : null;
  }
  const candidates = Object.values(manifest).filter((entry) => Array.isArray(entry?.files));
  return candidates.length === 1 ? candidates[0] : null;
}
