import { mkdir, lstat } from "node:fs/promises";
import { join } from "node:path";
import { execute } from "../../../shared/process/execute-child-process.mjs";
import { resolvePackExecutable } from "../../pack/resolve-pack-executable.mjs";
import { captureSmokeTargetState } from "../capture-smoke-target-state.mjs";
import { restoreSmokeTargetState } from "../restore-smoke-target-state.mjs";
import { finishSmokeRun } from "../finish-smoke-run.mjs";
import { assertSmokePackageParents } from "../assert-smoke-package-parents.mjs";
import { createSmokeTempRoot } from "../create-smoke-temp-root.mjs";
import { prepareSmokeTargetContext } from "../prepare-smoke/target-context.mjs";
import { runSmokePackageTransaction } from "./smoke-package-transaction.mjs";

export async function runNpmConsumerSmoke({
  root,
  target,
  packageJson,
  run = execute,
  resolveCommand = resolvePackExecutable,
  env = process.env,
  captureState = captureSmokeTargetState,
  restoreState = restoreSmokeTargetState,
  inspectTargetRoot = lstat,
  inspectTempRoot = lstat,
  createTempRoot,
  removeEmptyTempRoot,
  write = () => {},
}) {
  const context = await prepareSmokeTargetContext({
    root,
    target,
    packageJson,
    env,
    inspectTargetRoot,
  });
  if (context.error) return context.error;
  const { targetRoot, assertTargetIdentity, binNames, childEnv } = context;
  const tempState = await createSmokeTempRoot(
    root,
    inspectTempRoot,
    createTempRoot,
    removeEmptyTempRoot,
  );
  if (tempState.error) return tempState.error;
  const { path: tempRoot, identity: tempIdentity } = tempState;
  const packDirectory = join(tempRoot, "pack");
  const backupDirectory = join(tempRoot, "backup");
  let state;
  let outcome;
  try {
    await assertTargetIdentity();
    await assertSmokePackageParents(targetRoot, packageJson.name);
    await mkdir(backupDirectory);
    state = await captureState(
      targetRoot,
      packageJson.name,
      binNames,
      undefined,
      process.platform,
      backupDirectory,
    );
    write(`Target recovery snapshot: ${state.storage}`);
    await mkdir(packDirectory);
    const [command, prefix] = resolveCommand(childEnv, process.platform, process.execPath, root);
    const digest = await runSmokePackageTransaction({
      root,
      packageJson,
      run,
      command,
      prefix,
      packDirectory,
      targetRoot,
      assertTargetIdentity,
      env: { ...childEnv, npm_config_cache: join(tempRoot, "npm-cache") },
    });
    outcome = `Smoke passed: ${packageJson.name}@${packageJson.version}; SHA-256 ${digest}.`;
  } catch (error) {
    outcome = `Tarball consumer smoke failed: ${error.message}`;
  } finally {
    outcome = await finishSmokeRun({
      outcome,
      state,
      targetRoot,
      assertTargetIdentity,
      restoreState,
      tempRoot,
      tempIdentity,
    });
  }
  return outcome;
}
