import { focusedPathsFrom } from "../../parse/focused-arguments.mjs";

export function resolveFocusedScope(args = []) {
  const testPaths = focusedPathsFrom(args).map((path) =>
    path.replaceAll("\\", "/").replace(/^\.\//u, ""),
  );
  if (testPaths.length === 0 || testPaths.some((path) => !/^tests\/.+/iu.test(path))) return null;
  const sourcePaths = testPaths.map((path) =>
    path.slice("tests/".length).replace(/\.(?:test|spec)(?=\.[^.]+$)/iu, ""),
  );
  return Object.freeze({
    testPath: testPaths[0],
    sourcePath: `src/${sourcePaths[0]}`,
    testPaths: Object.freeze(testPaths),
    sourcePaths: Object.freeze(sourcePaths.map((path) => `src/${path}`)),
    paths: Object.freeze([...testPaths, ...sourcePaths.map((path) => `src/${path}`)]),
  });
}
