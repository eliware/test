const required = new Set(["package.json", "README.md", "AGENTS.md", "LICENSE", "RELEASE_NOTES.md"]);

export function validatePackManifestCoverage(packed) {
  const packedPaths = new Set(packed.map(({ path }) => path));
  const missing = [...required].filter((path) => !packedPaths.has(path));
  if (missing.length > 0) return `npm pack omitted required files: ${missing.join(", ")}.`;
  if (![...packedPaths].some((path) => path.startsWith("src/")))
    return "npm pack must include runtime files under src/.";
  if (![...packedPaths].some((path) => path.startsWith("docs/")))
    return "npm pack must include documentation files under docs/.";
  if (![...packedPaths].some((path) => path.startsWith("specs/")))
    return "npm pack must include specification files under specs/.";
  return null;
}
