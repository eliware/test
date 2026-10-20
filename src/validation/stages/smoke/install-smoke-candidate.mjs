import { lstat, readFile, rm } from "node:fs/promises";
import { validateInstalledSmokePackage } from "./install-smoke-candidate/installed-package.mjs";
import { installSmokePackage } from "./install-smoke-candidate/package-install.mjs";
import { runSmokeConsumerTest } from "./install-smoke-candidate/consumer-test.mjs";

export async function installSmokeCandidate({
  targetRoot,
  packageJson,
  tarball,
  run,
  command,
  prefix,
  env,
  inspect = lstat,
  resolveModule,
  remove = rm,
  readInstalled = readFile,
}) {
  await installSmokePackage({
    targetRoot,
    packageJson,
    tarball,
    run,
    command,
    prefix,
    env,
    inspect,
    remove,
  });
  await validateInstalledSmokePackage({
    targetRoot,
    packageJson,
    resolveModule,
    read: readInstalled,
  });
  await runSmokeConsumerTest({
    targetRoot,
    packageJson,
    run,
    command,
    prefix,
    env,
  });
}
