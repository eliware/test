import { selectPackManifestEntry } from "./select-pack-manifest-entry.mjs";
import { normalizeRedactedPackMetadata } from "./normalize-redacted-pack-metadata.mjs";

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
  const entry = selectPackManifestEntry(manifest, packageName);
  return entry
    ? { entry }
    : { error: "npm pack JSON manifest does not contain exactly the requested package." };
}
