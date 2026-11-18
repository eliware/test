import { realpathSync } from "node:fs";
import { dirname } from "node:path";
import isJestPackageInstalled from "./resolve/package.mjs";
import resolveMetadataJestBin from "./resolve/metadata-bin.mjs";
import validateJestExecutable from "./validate-executable.mjs";
export default function resolveJestBin(
  requireFromConsumer,
  packageName,
  resolveRealPath = realpathSync,
) {
  if (!isJestPackageInstalled(requireFromConsumer, packageName)) return undefined;
  try {
    const resolved = requireFromConsumer.resolve(`${packageName}/bin/jest`);
    const packagePath = requireFromConsumer.resolve(`${packageName}/package.json`);
    const packageDirectory = resolveRealPath(dirname(packagePath));
    if (validateJestExecutable(packageDirectory, resolved, resolveRealPath, packageName))
      return resolved;
  } catch (error) {
    if (error?.message?.includes("escapes its package directory")) throw error;
  }
  return resolveMetadataJestBin(requireFromConsumer, packageName, resolveRealPath);
}
