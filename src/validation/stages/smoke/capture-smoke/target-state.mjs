import { cp, lstat, readFile, readlink, rm, stat } from "node:fs/promises";
import assertSmokePackageParents from "../assert-smoke-package-parents.mjs";
import captureSmokeEntries from "./capture-entries.mjs";
const defaultFs = {
  cp,
  lstat,
  readFile,
  readlink,
  rm,
  stat,
};
export default async function captureSmokeTargetState(
  root,
  packageName,
  binNames = [],
  fs = defaultFs,
  platform = process.platform,
  storage,
) {
  const entries = await captureSmokeEntries(
    root,
    packageName,
    binNames,
    fs,
    platform,
    storage,
    (targetRoot, name) => assertSmokePackageParents(targetRoot, name, fs.lstat),
  );
  return {
    entries,
    storage,
    targetRoot: root,
    packageName,
  };
}
