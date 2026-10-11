import { mkdir, lstat } from "node:fs/promises";
import { join } from "node:path";
import { execute } from "../../shared/process/execute-child-process.mjs";
import { resolvePackExecutable } from "../pack/resolve-pack-executable.mjs";
import { captureSmokeTargetState } from "./capture-smoke-target-state.mjs";
import { restoreSmokeTargetState } from "./restore-smoke-target-state.mjs";
import { packSmokeCandidate } from "./pack-smoke-candidate.mjs";
import { installSmokeCandidate } from "./install-smoke-candidate.mjs";
import { prepareSmokeTarget } from "./prepare-smoke-target.mjs";
import { loadSmokeTarget } from "./load-smoke-target.mjs";
import { validateNpmConsumerSmokeRequest } from "./validate-npm-consumer-smoke-request.mjs";
import { resolveSmokeTarget } from "./resolve-smoke-target.mjs";
import { finishSmokeRun } from "./finish-smoke-run.mjs";
import { assertSmokePackageParents } from "./assert-smoke-package-parents.mjs";
import { createSmokeTempRoot } from "./create-smoke-temp-root.mjs";

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
  const request = validateNpmConsumerSmokeRequest({ root, target, packageJson });
  if (request.error) return request.error;
  // codescope ignore this because resolveSmokeTarget compares real paths and rejects targets inside the checkout.
  const targetResolution = await resolveSmokeTarget(root, request.targetRoot, inspectTargetRoot);
  if (targetResolution.error) return targetResolution.error;
  const { targetRoot, assertIdentity: assertTargetIdentity } = targetResolution;
  const loadedTarget = await loadSmokeTarget(targetRoot, packageJson?.name);
  if (loadedTarget.error) return loadedTarget.error;
  const binNames = Object.keys(packageJson?.bin ?? {});
  const childEnv = { ...env };
  // codescope ignore this because the next operation starts cleanup before any other setup can fail.
  const tempState = await createSmokeTempRoot(inspectTempRoot, createTempRoot, removeEmptyTempRoot);
  if (tempState.error) return tempState.error;
  const { path: tempRoot, identity: tempIdentity } = tempState;
  const packDirectory = join(tempRoot, "pack");
  let state;
  let outcome;
  try {
    await assertTargetIdentity();
    // codescope ignore this because smoke checks package parents before capture and before each mutation.
    await assertSmokePackageParents(targetRoot, packageJson.name);
    state = await captureState(targetRoot, packageJson.name, binNames);
    write(`Target recovery snapshot: ${state.storage}`);
    await mkdir(packDirectory);
    const [command, prefix] = resolveCommand(childEnv, process.platform, process.execPath, root);
    const { tarball, digest } = await packSmokeCandidate({
      root,
      packageJson,
      run,
      command,
      prefix,
      packDirectory,
      env: childEnv,
    });
    await assertTargetIdentity();
    // codescope ignore this because prepareSmokeTarget checks package parents before removal.
    await prepareSmokeTarget({
      targetRoot,
      packageName: packageJson.name,
    });
    await assertTargetIdentity();
    // codescope ignore this because installSmokeCandidate checks package parents before install.
    await installSmokeCandidate({
      targetRoot,
      packageJson,
      tarball,
      run,
      command,
      prefix,
      env: childEnv,
    });
    outcome = `Smoke passed: ${packageJson.name}@${packageJson.version}; SHA-256 ${digest}.`;
  } catch (error) {
    outcome = `Tarball consumer smoke failed: ${error.message}`;
  } finally {
    // codescope ignore this because restoration checks target identity and package parents before each captured path.
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
