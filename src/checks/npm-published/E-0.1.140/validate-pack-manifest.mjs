function allowedByEntry(path, entry) {
  const normalized = entry.replaceAll("\\", "/").replace(/\/$/u, "");
  return path === normalized || path.startsWith(`${normalized}/`);
}

export function validatePackManifest(stdout, files) {
  let manifest;
  try { manifest = JSON.parse(stdout); } catch { return "npm pack returned invalid JSON manifest."; }
  const packed = Array.isArray(manifest)
    ? manifest[0]?.files
    : Array.isArray(manifest?.files)
      ? manifest.files
      : Object.values(manifest ?? {}).find((entry) => Array.isArray(entry?.files))?.files;
  if (!Array.isArray(packed) || packed.some((entry) => typeof entry?.path !== "string")) {
    return "npm pack JSON manifest must contain a files array with paths.";
  }
  const allowlist = Array.isArray(files) ? files : [];
  const required = new Set(["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md"]);
  const unexpected = packed.map((entry) => entry.path).filter((path) =>
    !required.has(path) && !allowlist.some((entry) => typeof entry === "string" && allowedByEntry(path, entry)),
  );
  if (unexpected.length > 0) return `npm pack included files outside package.json.files: ${unexpected.join(", ")}.`;
  const packedPaths = new Set(packed.map((entry) => entry.path));
  const missing = [...required].filter((path) => !packedPaths.has(path));
  if (missing.length > 0) return `npm pack omitted required files: ${missing.join(", ")}.`;
  const unused = allowlist.filter((entry) =>
    typeof entry === "string" && !packed.some(({ path }) => allowedByEntry(path, entry)),
  );
  if (unused.length > 0) {
    return `package.json.files entries do not match packed files: ${unused.join(", ")}.`;
  }
  return null;
}
