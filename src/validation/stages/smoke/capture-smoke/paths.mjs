import { captureSmokePath } from "./entry.mjs";
import { selectSmokePaths } from "./select-paths.mjs";

export async function captureSmokePaths(
  root,
  packageName,
  binNames,
  storage,
  fs,
  platform,
  assertPackageParents = async () => {},
) {
  const entries = [];
  for (const path of selectSmokePaths(root, packageName, binNames)) {
    await assertPackageParents(root, packageName);
    entries.push(await captureSmokePath(path, storage, fs, platform));
  }
  return entries;
}
