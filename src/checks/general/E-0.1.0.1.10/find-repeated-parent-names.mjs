export function findRepeatedParentNames(files) {
  return files.filter((path) => {
    const normalized = path.replaceAll("\\", "/");
    const separator = normalized.lastIndexOf("/");
    if (separator < 0) return false;
    const parent = normalized.slice(0, separator).split("/").at(-1);
    const filename = normalized.slice(separator + 1);
    const stem = filename.endsWith(".test.mjs")
      ? filename.slice(0, -9)
      : filename.endsWith(".mjs")
        ? filename.slice(0, -4)
        : "";
    return stem.startsWith(`${parent}-`);
  });
}
