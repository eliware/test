import { readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

export function resolveJestBin(requireFromConsumer, packageName, resolveRealPath = realpathSync) {
  try {
    requireFromConsumer.resolve(packageName);
  } catch (error) {
    if (error?.code === "MODULE_NOT_FOUND" && error.message.includes(`'${packageName}'`))
      return undefined;
    throw error;
  }

  try {
    const resolved = requireFromConsumer.resolve(`${packageName}/bin/jest`);
    const packagePath = requireFromConsumer.resolve(`${packageName}/package.json`);
    const packageDirectory = resolveRealPath(dirname(packagePath));
    const actualPath = resolveRealPath(resolved);
    if (!isPathInside(packageDirectory, actualPath))
      throw new Error(`Installed ${packageName} Jest executable escapes its package directory.`);
    if (statSync(actualPath).isFile()) return resolved;
  } catch (error) {
    if (error?.message?.includes("escapes its package directory")) throw error;
  }

  const packagePath = requireFromConsumer.resolve(`${packageName}/package.json`);
  const metadata = JSON.parse(readFileSync(packagePath, "utf8"));
  const bin = typeof metadata.bin === "string" ? metadata.bin : metadata.bin?.jest;
  if (typeof bin !== "string" || bin.length === 0)
    throw new Error(`Installed ${packageName} package does not declare a Jest executable.`);
  const packageDirectory = resolveRealPath(dirname(packagePath));
  const resolved = resolve(packageDirectory, bin);
  if (!isPathInside(packageDirectory, resolved))
    throw new Error(`Installed ${packageName} Jest executable escapes its package directory.`);
  let isFile = false;
  try {
    if (!isPathInside(packageDirectory, resolveRealPath(resolved)))
      throw new Error(`Installed ${packageName} Jest executable escapes its package directory.`);
    isFile = statSync(resolved).isFile();
  } catch (error) {
    if (error.message.includes("escapes its package directory")) throw error;
  }
  if (!isFile)
    throw new Error(`Installed ${packageName} Jest executable does not exist: ${resolved}`);
  return resolved;
}

function isPathInside(directory, target) {
  const relativePath = relative(directory, target);
  return (
    relativePath === "" ||
    (!isAbsolute(relativePath) && relativePath !== ".." && !relativePath.startsWith(`..${sep}`))
  );
}
