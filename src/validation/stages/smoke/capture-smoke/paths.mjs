import { join } from "node:path";
import { captureSmokePath } from "./entry.mjs";

export async function captureSmokePaths(
  root,
  packageName,
  binNames,
  storage,
  fs,
  platform,
  assertPackageParents = async () => {},
) {
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
  const entries = [];
  for (const path of new Set(paths)) {
    await assertPackageParents(root, packageName);
    entries.push(await captureSmokePath(path, storage, fs, platform));
  }
  return entries;
}
