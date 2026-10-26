import { isSensitivePath } from "../../../checks/general/E-0.1.0.1.8/validate/tracked/is/sensitive-path.mjs";

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
    const nonEnvironmentSegments = segments.filter((segment) => !isEnvironmentFile(segment));
    return (
      segments.some((segment) => prohibitedNames.has(segment)) ||
      isSensitivePath(nonEnvironmentSegments.join("/")) ||
      segments.some(isPackSecretName)
    );
  });
}

function isEnvironmentFile(segment) {
  return /^\.env(?:$|\.)/u.test(segment) || segment === ".envrc";
}

function isPackSecretName(segment) {
  const fileName = segment.replace(/\.[^.]+$/u, "");
  const sourceFile = /\.(?:mjs|cjs|js|mts|cts|ts|tsx|jsx)$/u.test(segment);
  return !sourceFile && /^(?:secret|secrets|credential|credentials|token|tokens)$/u.test(fileName);
}
