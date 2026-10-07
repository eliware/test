const prohibitedNames = new Set([
  "tests",
  "test",
  "__tests__",
  "test-fixtures",
  ".github",
  ".knit",
  "node_modules",
  "coverage",
  "build",
  "dist",
  "package-lock.json",
  "npm-shrinkwrap.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lock",
  "bun.lockb",
  ".npmrc",
  ".env",
  ".env.local",
  ".env.production",
]);

export function findProhibitedPackFiles(paths = []) {
  return paths.filter((path) => {
    const segments = path.toLowerCase().replaceAll("\\", "/").split("/");
    return segments.some((segment) => {
      if (prohibitedNames.has(segment)) return true;
      const fileName = segment.replace(/\.[^.]+$/u, "");
      const sourceFile = /\.(?:mjs|cjs|js|mts|cts|ts|tsx|jsx)$/u.test(segment);
      return (
        (!sourceFile &&
          /^(?:secret|secrets|credential|credentials|token|tokens)$/u.test(fileName)) ||
        /(?:private[-_.]?key|credentials?)[.](?:pem|key|p12|pfx)$/u.test(segment) ||
        /\.(?:pem|key|p12|pfx)$/u.test(segment)
      );
    });
  });
}
