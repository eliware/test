import { cp, lstat, readFile, readlink, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { captureSmokePath } from "./path.mjs";

const defaultFs = { cp, lstat, readFile, readlink, rm, stat };

export async function captureSmokeTargetState(
  root,
  packageName,
  binNames = [],
  fs = defaultFs,
  platform = process.platform,
  storage,
) {
  if (typeof storage !== "string" || !storage)
    throw new Error("Smoke state storage must be inside the smoke workspace.");
  const packagePath = join(root, "node_modules", ...packageName.split("/"));
  const paths = [
    join(root, "package.json"),
    join(root, "package-lock.json"),
    join(root, "npm-shrinkwrap.json"),
    join(root, "node_modules", ".package-lock.json"),
    packagePath,
    ...binNames.flatMap((name) =>
      ["", ".cmd", ".ps1"].map((suffix) => join(root, "node_modules", ".bin", `${name}${suffix}`)),
    ),
  ];
  try {
    const entries = [];
    for (const path of new Set(paths))
      entries.push(await captureSmokePath(path, storage, fs, platform));
    return { entries, storage, targetRoot: root, packageName };
  } catch (error) {
    try {
      await fs.rm(storage, { recursive: true, force: true });
    } catch (cleanupError) {
      throw new Error(
        `Failed to capture smoke target state (${error.message}). Temporary backup may remain at ${storage}: ${cleanupError.message}`,
        { cause: error },
      );
    }
    throw error;
  }
}
