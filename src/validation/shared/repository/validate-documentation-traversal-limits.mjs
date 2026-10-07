export function assertDocumentationFileLimit(fileCount, maxFiles) {
  if (fileCount > maxFiles)
    throw new Error(`Documentation traversal exceeded the ${maxFiles}-file limit.`);
}

export function validateDocumentationTraversalLimits(
  records,
  { base, prefix, maxDepth, maxFiles, fileCount, includeGenerated, generatedPath },
) {
  assertDocumentationFileLimit(fileCount, maxFiles);
  const directories = records.filter(
    ({ path, type }) => type === "directory" && (includeGenerated || !generatedPath.test(path)),
  );
  const exceedsDirectoryDepth = directories.some(({ path }) => {
    if (base && path === base) return false;
    const relativePath = base ? path.slice(prefix.length) : path;
    return relativePath.split("/").length > maxDepth;
  });
  const exceedsFileDepth = records.some(({ path, type }) => {
    if (
      type !== "file" ||
      !path.startsWith(prefix) ||
      (!includeGenerated && generatedPath.test(path))
    )
      return false;
    const relativePath = path.slice(prefix.length);
    return relativePath.split("/").length - 1 > maxDepth;
  });
  if (exceedsDirectoryDepth || exceedsFileDepth)
    throw new Error(`Documentation traversal exceeded the ${maxDepth}-level depth limit.`);
}
