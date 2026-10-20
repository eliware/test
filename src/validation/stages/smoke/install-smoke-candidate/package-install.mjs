import { lstat, rm } from "node:fs/promises";
import { join } from "node:path";
import { assertSmokePackageParents } from "../assert-smoke-package-parents.mjs";
import { smokeCommandFailure } from "./command-failure.mjs";

export async function installSmokePackage({
  targetRoot,
  packageJson,
  tarball,
  run,
  command,
  prefix,
  env,
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
  const result = await run(
    command,
    [
      ...prefix,
      "install",
      "--ignore-scripts",
      "--no-save",
      "--package-lock=false",
      "--no-audit",
      "--no-fund",
      tarball,
    ],
    { cwd: targetRoot, env },
  );
  if (result.code !== 0)
    throw new Error(smokeCommandFailure(result, "Tarball installation failed"));
}
