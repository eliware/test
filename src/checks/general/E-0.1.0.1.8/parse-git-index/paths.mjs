export function parseGitNulPaths(output) {
  const text = Buffer.isBuffer(output) ? output.toString("utf8") : output;
  if (typeof text !== "string" || (text && !text.endsWith("\0")))
    throw new Error("Git returned incomplete NUL-delimited paths.");
  const paths = text ? text.slice(0, -1).split("\0") : [];
  if (paths.some((path) => !path || path.startsWith("/") || /^[A-Za-z]:/u.test(path)))
    throw new Error("Git returned an invalid repository path.");
  return paths;
}
