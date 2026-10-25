import { packSmokeCandidate } from "../pack-smoke-candidate.mjs";
import { installSmokeCandidate } from "../install-smoke-candidate.mjs";

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
  await installCandidate({
    targetRoot,
    packageJson,
    tarball,
    run,
    command,
    prefix,
    env,
    assertTargetIdentity,
  });
  return digest;
}
