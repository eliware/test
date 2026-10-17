import { lstat, rm } from "node:fs/promises";
import { join } from "node:path";
import { assertSmokePackageParents } from "../assert-smoke-package-parents.mjs";

export async function prepareSmokeTarget({ targetRoot, packageName, inspect = lstat }) {
  await assertSmokePackageParents(targetRoot, packageName, inspect);
  await rm(join(targetRoot, "node_modules", ...packageName.split("/")), {
    recursive: true,
    force: true,
  });
}
