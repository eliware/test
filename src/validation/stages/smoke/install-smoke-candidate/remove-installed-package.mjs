import { lstat, rm } from "node:fs/promises";
import { join } from "node:path";
import assertSmokePackageParents from "../assert-smoke-package-parents.mjs";
export default async function removeInstalledPackage({
  targetRoot,
  packageJson,
  inspect = lstat,
  remove = rm,
  assertTargetIdentity = async () => {},
}) {
  await assertTargetIdentity();
  await assertSmokePackageParents(targetRoot, packageJson.name, inspect);
  await assertTargetIdentity();
  await remove(join(targetRoot, "node_modules", ...packageJson.name.split("/")), {
    recursive: true,
    force: true,
  });
  await assertTargetIdentity();
  await assertSmokePackageParents(targetRoot, packageJson.name, inspect);
  await assertTargetIdentity();
}
