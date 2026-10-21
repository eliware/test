import { mkdir, lstat } from "node:fs/promises";
import { join } from "node:path";
import { execute } from "../../../shared/process/execute-child-process.mjs";
import { resolvePackExecutable } from "../../pack/resolve-pack-executable.mjs";
import { captureSmokeTargetState } from "../capture-smoke/target-state.mjs";
import { restoreSmokeTargetState } from "../restore/smoke-target-state.mjs";
import { finishSmokeRun } from "../finish-smoke-run.mjs";
import { assertSmokePackageParents } from "../assert-smoke-package-parents.mjs";
import { createSmokeTempRoot } from "../create-smoke-temp-root.mjs";
import { prepareSmokeTargetContext } from "../prepare-smoke/target-context.mjs";
import { prepareSmokeState } from "../prepare-smoke/state.mjs";
import { prepareSmokeWorkspace } from "../prepare-smoke/workspace.mjs";
import { runSmokePackageTransaction } from "./smoke-package-transaction.mjs";
import { formatSmokeOutcome } from "./format-smoke-outcome.mjs";

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
  const workspace = await prepareSmokeWorkspace({
    root,
    inspectTempRoot,
    createTempRoot,
    removeEmptyTempRoot,
    createTempWorkspace: createSmokeTempRoot,
    prepareState: prepareSmokeState,
    createDirectory: mkdir,
    stateOptions: {
      targetRoot,
      packageJson,
      binNames,
      assertTargetIdentity,
      captureState,
      assertPackageParents: assertSmokePackageParents,
      write,
      platform: process.platform,
    },
  });
  if (workspace.error && !workspace.tempRoot) return workspace.error;
  const { tempRoot, tempIdentity, packDirectory, state } = workspace;
  let outcome;
  try {
    if (workspace.error) throw workspace.error;
    const [command, prefix] = resolveCommand(childEnv, process.platform, process.execPath, root);
    outcome = await formatSmokeOutcome(packageJson, () =>
      runSmokePackageTransaction({
        root,
        packageJson,
        run,
        command,
        prefix,
        packDirectory,
        targetRoot,
        assertTargetIdentity,
        env: { ...childEnv, npm_config_cache: join(tempRoot, "npm-cache") },
      }),
    );
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
