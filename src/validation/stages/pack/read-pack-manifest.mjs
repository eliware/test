function normalizeRedactedPackMetadata(stdout) {
  return stdout.replace(
    /("(?:size|unpackedSize|entryCount|mode)"\s*:\s*)(?:\d|\[REDACTED\])+/gu,
    (_match, property) => `${property}0`,
  );
}

function selectManifestEntry(manifest, packageName) {
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

export function readPackManifest(stdout, packageName) {
  let manifest;
  try {
    manifest = JSON.parse(stdout);
  } catch {
    const normalized = normalizeRedactedPackMetadata(stdout);
    if (normalized === stdout) return { error: "npm pack returned invalid JSON manifest." };
    try {
      manifest = JSON.parse(normalized);
    } catch {
      return { error: "npm pack returned invalid JSON manifest." };
    }
  }
  if (manifest === null || typeof manifest !== "object") {
    return { error: "npm pack JSON manifest must contain a files array with paths." };
  }
  const entry = selectManifestEntry(manifest, packageName);
  return entry
    ? { entry }
    : { error: "npm pack JSON manifest does not contain exactly the requested package." };
}
