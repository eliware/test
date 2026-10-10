import { lstat, rm } from "node:fs/promises";
import { join } from "node:path";
import { assertSmokePackageParents } from "./assert-smoke-package-parents.mjs";

export function hasPackageDependency(targetPackage, packageName) {
  return ["dependencies", "devDependencies", "optionalDependencies"].some((field) =>
    Object.hasOwn(targetPackage[field] ?? {}, packageName),
  );
}

export async function prepareSmokeTarget({ targetRoot, packageName, inspect = lstat }) {
  await assertSmokePackageParents(targetRoot, packageName, inspect);
  // codescope ignore this because rm removes a package leaf link without following its target.
  await rm(join(targetRoot, "node_modules", ...packageName.split("/")), {
    recursive: true,
    force: true,
  });
}
