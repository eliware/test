import { packSmokeCandidate } from "./pack-smoke-candidate.mjs";
import { installSmokeCandidate } from "./install-smoke-candidate.mjs";
import { prepareSmokeTarget } from "./prepare-smoke-target.mjs";

export async function runSmokePackageTransaction({
  root,
  packageJson,
  run,
  command,
  prefix,
  packDirectory,
  targetRoot,
  assertTargetIdentity,
  env,
  packCandidate = packSmokeCandidate,
  prepareTarget = prepareSmokeTarget,
  installCandidate = installSmokeCandidate,
}) {
  const { tarball, digest } = await packCandidate({
    root,
    packageJson,
    run,
    command,
    prefix,
    packDirectory,
    env,
  });
  await assertTargetIdentity();
  await prepareTarget({ targetRoot, packageName: packageJson.name });
  await assertTargetIdentity();
  await installCandidate({
    targetRoot,
    packageJson,
    tarball,
    run,
    command,
    prefix,
    env,
  });
  return digest;
}
