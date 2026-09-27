function allowedByEntry(path, entry) {
  const normalized = entry.replace(/\/$/u, "");
  return path === normalized || path.startsWith(`${normalized}/`);
}

function safeRelativePath(path) {
  if (typeof path !== "string" || !path || path !== path.trim() || path.includes("\\"))
    return false;
  if (path.startsWith("/") || /^[A-Za-z]:/u.test(path)) return false;
  const segments = (path.endsWith("/") ? path.slice(0, -1) : path).split("/");
  return segments.every((segment) => segment && segment !== "." && segment !== "..");
}

function safeAllowlistEntry(entry) {
  return safeRelativePath(entry) && !/[*!?{}()[\]]/u.test(entry) && !entry.startsWith("!");
}

export function validatePackManifest(stdout, files, packageName) {
  let manifest;
  try {
    manifest = JSON.parse(stdout);
  } catch {
    return "npm pack returned invalid JSON manifest.";
  }
  if (manifest === null || typeof manifest !== "object")
    return "npm pack JSON manifest must contain a files array with paths.";
  const entry = selectManifestEntry(manifest, packageName);
  if (!entry) return "npm pack JSON manifest does not contain exactly the requested package.";
  const packed = entry.files;
  if (!Array.isArray(packed) || packed.some((entry) => typeof entry?.path !== "string")) {
    return "npm pack JSON manifest must contain a files array with paths.";
  }
  const allowlist = Array.isArray(files) ? [...new Set(files)] : [];
  const unsafeAllowlistIndex = allowlist.findIndex((entry) => !safeAllowlistEntry(entry));
  if (unsafeAllowlistIndex !== -1) {
    return `package.json.files contains an unsafe path entry: ${allowlist[unsafeAllowlistIndex]}.`;
  }
  const unsafePackedPath = packed.find(({ path }) => !safeRelativePath(path));
  if (unsafePackedPath)
    return `npm pack manifest contains an unsafe file path: ${unsafePackedPath.path}.`;
  const required = new Set(["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md"]);
  const unexpected = packed
    .map((entry) => entry.path)
    .filter(
      (path) =>
        !required.has(path) &&
        !allowlist.some((entry) => typeof entry === "string" && allowedByEntry(path, entry)),
    );
  if (unexpected.length > 0)
    return `npm pack included files outside package.json.files: ${unexpected.join(", ")}.`;
  const packedPaths = new Set(packed.map((entry) => entry.path));
  const missing = [...required].filter((path) => !packedPaths.has(path));
  if (missing.length > 0) return `npm pack omitted required files: ${missing.join(", ")}.`;
  const unused = allowlist.filter(
    (entry) => typeof entry === "string" && !packed.some(({ path }) => allowedByEntry(path, entry)),
  );
  if (unused.length > 0) {
    return `package.json.files entries do not match packed files: ${unused.join(", ")}.`;
  }
  return null;
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
