import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import validateJestExecutable from "../validate-executable.mjs";
export default function resolveMetadataJestBin(requireFromConsumer, packageName, resolveRealPath) {
  const packagePath = requireFromConsumer.resolve(`${packageName}/package.json`);
  const metadata = JSON.parse(readFileSync(packagePath, "utf8"));
  const bin = typeof metadata.bin === "string" ? metadata.bin : metadata.bin?.jest;
  if (typeof bin !== "string" || bin.length === 0)
    throw new Error(`Installed ${packageName} package does not declare a Jest executable.`);
  const packageDirectory = resolveRealPath(dirname(packagePath));
  const executablePath = resolve(packageDirectory, bin);
  let isFile = false;
  try {
    isFile = validateJestExecutable(packageDirectory, executablePath, resolveRealPath, packageName);
  } catch (error) {
    if (error.message.includes("escapes its package directory"))
      throw new Error(`Installed ${packageName} Jest executable escapes its package directory.`);
  }
  if (!isFile)
    throw new Error(`Installed ${packageName} Jest executable does not exist: ${executablePath}`);
  return executablePath;
}
