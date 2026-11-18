import removeInstalledPackage from "./remove-installed-package.mjs";
import smokeCommandFailure from "./command-failure.mjs";
export default async function installSmokePackage({
  targetRoot,
  packageJson,
  tarball,
  run,
  command,
  prefix,
  env,
  inspect,
  remove,
  assertTargetIdentity = async () => {},
}) {
  await removeInstalledPackage({
    targetRoot,
    packageJson,
    inspect,
    remove,
    assertTargetIdentity,
  });
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
    {
      cwd: targetRoot,
      env,
    },
  );
  if (result.code !== 0)
    throw new Error(smokeCommandFailure(result, "Tarball installation failed"));
}
