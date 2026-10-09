const prohibitedNames = new Set([
  "tests",
  "test",
  "__tests__",
  "test-fixtures",
  ".github",
  ".knit",
  ".git",
  "node_modules",
  "coverage",
  "build",
  "dist",
  "generated",
  "artifacts",
  "test-results",
  ".gitignore",
  "package-lock.json",
  "npm-shrinkwrap.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lock",
  "bun.lockb",
  ".npmrc",
]);

export function findProhibitedPackFiles(paths = []) {
  return paths.filter((path) => {
    const segments = path.toLowerCase().replaceAll("\\", "/").split("/");
    return segments.some((segment) => {
      if (prohibitedNames.has(segment)) return true;
      const fileName = segment.replace(/\.[^.]+$/u, "");
      const sourceFile = /\.(?:mjs|cjs|js|mts|cts|ts|tsx|jsx)$/u.test(segment);
      return (
        (segment.startsWith(".env") && !segment.endsWith(".example")) ||
        (!sourceFile &&
          /^(?:secret|secrets|credential|credentials|token|tokens)$/u.test(fileName)) ||
        /(?:private[-_.]?key|credentials?)[.](?:pem|key|p12|pfx)$/u.test(segment) ||
        /\.(?:pem|key|p12|pfx)$/u.test(segment)
      );
    });
  });
}
