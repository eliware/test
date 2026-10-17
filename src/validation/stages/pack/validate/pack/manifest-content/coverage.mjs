const required = new Set(["package.json", "README.md", "AGENTS.md", "LICENSE", "RELEASE_NOTES.md"]);

function allowedByEntry(path, entry) {
  const normalized = entry.replace(/\/$/u, "");
  return path === normalized || path.startsWith(`${normalized}/`);
}

export function validatePackManifestCoverage(packed, files) {
  const packedPaths = new Set(packed.map(({ path }) => path));
  const unexpected = packed
    .map((entry) => entry.path)
    .filter(
      (path) =>
        path !== "package.json" &&
        !files.some((entry) => typeof entry === "string" && allowedByEntry(path, entry)),
    );
  if (unexpected.length > 0)
    return `npm pack included files outside package.json.files: ${unexpected.join(", ")}.`;
  const missing = [...required].filter((path) => !packedPaths.has(path));
  if (missing.length > 0) return `npm pack omitted required files: ${missing.join(", ")}.`;
  if (![...packedPaths].some((path) => path.startsWith("src/")))
    return "npm pack must include runtime files under src/.";
  if (![...packedPaths].some((path) => path.startsWith("docs/")))
    return "npm pack must include documentation files under docs/.";
  if (![...packedPaths].some((path) => path.startsWith("specs/")))
    return "npm pack must include specification files under specs/.";
  const unused = files.filter(
    (entry) => typeof entry === "string" && !packed.some(({ path }) => allowedByEntry(path, entry)),
  );
  if (unused.length > 0)
    return `package.json.files entries do not match packed files: ${unused.join(", ")}.`;
  return null;
}
