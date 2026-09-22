import { focusedPathFrom } from "./parse-focused-arguments.mjs";

export function resolveFocusedScope(args = []) {
  const testPath = focusedPathFrom(args);
  if (!testPath) return null;
  const normalizedTestPath = testPath.replaceAll("\\", "/").replace(/^\.\//u, "");
  const match = normalizedTestPath.match(/^(?:tests?|specs?)\/(.+)$/iu);
  const relativeTestPath = match[1];
  const sourcePath = relativeTestPath.replace(/\.(?:test|spec)(?=\.[^.]+$)/iu, "");
  return Object.freeze({
    testPath: normalizedTestPath,
    sourcePath: `src/${sourcePath}`,
    paths: Object.freeze([normalizedTestPath, `src/${sourcePath}`]),
  });
}
