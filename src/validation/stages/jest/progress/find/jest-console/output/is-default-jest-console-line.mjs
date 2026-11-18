import normalizeRepositoryRelativePath from "../../../../../../shared/repository/normalize-repository/relative-path.mjs";
function isDefaultJestConsoleLine(record, outputs, root = process.cwd()) {
  return outputs.some((output) => {
    if (
      record.suite !== "unknown test suite" &&
      reportPath(output.testFilePath, root) !== record.suite
    )
      return false;
    if (record.line === `console.${output.type ?? "log"}`) return true;
    return String(output.message ?? "")
      .split(/\r?\n/u)
      .some((line) => line.trim() === record.line);
  });
}
function reportPath(path, root) {
  if (typeof path !== "string" || !path) return "unknown test suite";
  return normalizeRepositoryRelativePath(path, root);
}
export default isDefaultJestConsoleLine;
