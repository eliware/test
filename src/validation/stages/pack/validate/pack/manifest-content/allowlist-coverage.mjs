function allowedByEntry(path, entry) {
  const normalized = entry.replace(/\/$/u, "");
  return path === normalized || path.startsWith(`${normalized}/`);
}
export default function validatePackManifestUnexpectedPaths(packed, files) {
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
