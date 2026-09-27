function normalizeSource(file) {
  const normalized = file.replaceAll("\\", "/").replace(/^\.\//u, "");
  const sourceIndex = normalized.lastIndexOf("/src/");
  return sourceIndex < 0 ? normalized : normalized.slice(sourceIndex + 1);
}

function isSourcePath(file) {
  const segments = normalizeSource(file).split("/");
  return segments[0] === "src" &&
    !segments.slice(1).some((segment) => ["test", "tests", "fixture", "fixtures", "generated", "dist", "build"].includes(segment)) &&
    /\.(?:mjs|js|cjs)$/iu.test(segments.at(-1));
}

export function validateTextCoverageRows(fileRows, expectedFiles) {
  const invalidRows = fileRows.filter(({ file }) => !isSourcePath(file));
  if (invalidRows.length > 0) {
    throw new Error(
      `Text coverage contains non-source file row(s): ${invalidRows.map(({ file }) => file).join(", ")}.`,
    );
  }
  if (expectedFiles.length === 0) return;
  const actual = fileRows.map(({ file }) => normalizeSource(file));
  const expected = expectedFiles.map(normalizeSource);
  const missing = expected.filter((file) => !actual.includes(file));
  const unexpected = actual.filter((file) => !expected.includes(file));
  const duplicates = actual.filter((file, index) => actual.indexOf(file) !== index);
  if (missing.length || unexpected.length || duplicates.length) {
    throw new Error(
      `Text coverage source rows do not match discovered source files (missing: ${missing.join(", ") || "none"}; unexpected: ${unexpected.join(", ") || "none"}; duplicate: ${duplicates.join(", ") || "none"}).`,
    );
  }
}
