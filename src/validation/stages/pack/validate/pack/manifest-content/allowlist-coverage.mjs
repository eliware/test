function allowedByEntry(path, entry) {
  const normalized = entry.replace(/\/$/u, "");
  return path === normalized || path.startsWith(`${normalized}/`);
}

export function validatePackManifestUnexpectedPaths(packed, files) {
  const unexpected = packed
    .map((entry) => entry.path)
    .filter(
      (path) =>
        path !== "package.json" &&
        !files.some((entry) => typeof entry === "string" && allowedByEntry(path, entry)),
    );
  if (unexpected.length > 0)
    return `npm pack included files outside package.json.files: ${unexpected.join(", ")}.`;
  return null;
}

export function validatePackManifestUnusedAllowlistEntries(packed, files) {
  const unused = files.filter(
    (entry) => typeof entry === "string" && !packed.some(({ path }) => allowedByEntry(path, entry)),
  );
  if (unused.length > 0)
    return `package.json.files entries do not match packed files: ${unused.join(", ")}.`;
  return null;
}
