const metrics = ["statements", "branches", "functions", "lines"];

function parseRow(line) {
  const columns = line.split("|").map((value) => value.trim());
  if (columns.length < 5 || !columns[0] || /^[-\s]+$/u.test(columns[0])) return null;
  const values = columns.slice(1, 5).map((value) => Number.parseFloat(value));
  if (values.some((value) => !Number.isFinite(value))) return null;
  return { file: columns[0], values };
}

export function parseText(text, expectedFiles = []) {
  const rows = text.split(/\r?\n/).map(parseRow).filter(Boolean);
  const aggregate = rows.find(({ file }) => /^All files$/iu.test(file));
  const fileRows = rows.filter(({ file }) => !/^All files$/iu.test(file));
  if (!aggregate || fileRows.length === 0) return null;
  const invalidRows = fileRows.filter(({ file }) => !isSourcePath(file));
  if (invalidRows.length > 0) throw new Error(`Text coverage contains non-source file row(s): ${invalidRows.map(({ file }) => file).join(", ")}.`);
  if (expectedFiles.length === 0) return null;
  assertCompleteRows(fileRows, expectedFiles);

  return {
    gaps: fileRows
      .filter(({ values }) => values.some((value) => value !== 100))
      .map(({ file, values }) => ({
        file,
        metrics: Object.fromEntries(metrics.map((metric, index) => [metric, values[index]])),
        lines: [],
        statements: [],
        branches: [],
        functions: [],
      })),
    totals: Object.fromEntries(metrics.map((metric, index) => [metric, aggregate.values[index]])),
  };
}

function assertCompleteRows(fileRows, expectedFiles) {
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

function normalizeSource(file) {
  const normalized = file.replaceAll("\\", "/").replace(/^\.\//u, "");
  const sourceIndex = normalized.lastIndexOf("/src/");
  return sourceIndex < 0 ? normalized : normalized.slice(sourceIndex + 1);
}

function isSourcePath(file) {
  const normalized = file.replaceAll("\\", "/").replace(/^\.\//u, "");
  const sourceIndex = normalized.lastIndexOf("/src/");
  const sourcePath = sourceIndex < 0 ? normalized : normalized.slice(sourceIndex + 1);
  return /^src\/(?!.*(?:^|\/)(?:tests?|fixtures?|generated|dist|build)(?:\/|$)).+\.(?:mjs|js|cjs)$/iu.test(sourcePath);
}
