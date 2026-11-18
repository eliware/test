import { isAbsolute, relative, sep } from "node:path";
import { realpathSync, statSync } from "node:fs";
export default function validateJestExecutable(
  packageDirectory,
  executablePath,
  resolveRealPath = realpathSync,
  packageName = "Jest",
) {
  if (!isPathInside(packageDirectory, executablePath))
    throw new Error(`Installed ${packageName} Jest executable escapes its package directory.`);
  const actualPath = resolveRealPath(executablePath);
  if (!isPathInside(packageDirectory, actualPath))
    throw new Error(`Installed ${packageName} Jest executable escapes its package directory.`);
  return statSync(actualPath).isFile();
}
function isPathInside(directory, target) {
  const relativePath = relative(directory, target);
  return (
    relativePath === "" ||
    (!isAbsolute(relativePath) && relativePath !== ".." && !relativePath.startsWith(`..${sep}`))
  );
}
