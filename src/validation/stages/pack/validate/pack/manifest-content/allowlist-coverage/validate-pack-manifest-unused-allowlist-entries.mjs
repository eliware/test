function allowedByEntry(path, entry) {
  const normalized = entry.replace(/\/$/u, "");
  return path === normalized || path.startsWith(`${normalized}/`);
}
function validatePackManifestUnusedAllowlistEntries(packed, files) {
  const unused = files.filter(
    (entry) => typeof entry === "string" && !packed.some(({ path }) => allowedByEntry(path, entry)),
  );
  if (unused.length > 0)
    return `package.json.files entries do not match packed files: ${unused.join(", ")}.`;
  return null;
}
export default validatePackManifestUnusedAllowlistEntries;
