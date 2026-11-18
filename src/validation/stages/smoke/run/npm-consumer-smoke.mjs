import { join } from "node:path";
import execute from "../../../shared/process/execute-child-process.mjs";
import resolvePackExecutable from "../../pack/resolve-pack-executable.mjs";
import captureSmokeTargetState from "../capture-smoke/target-state.mjs";
import restoreSmokeTargetState from "../restore/smoke-target-state.mjs";
import prepareNpmConsumerSmokeWorkspace from "./prepare-workspace.mjs";
import finalizeNpmConsumerSmokeWorkspace from "./finalize-workspace.mjs";
import runSmokePackageTransaction from "./smoke-package-transaction.mjs";
export default async function runNpmConsumerSmoke({
  root,
  target,
  packageJson,
  run = execute,
  resolveCommand = resolvePackExecutable,
  env = process.env,
  captureState = captureSmokeTargetState,
  restoreState = restoreSmokeTargetState,
  inspectTargetRoot,
  inspectTempRoot,
  createTempRoot,
  removeEmptyTempRoot,
  write = () => {},
}) {
  const prepared = await prepareNpmConsumerSmokeWorkspace({
    root,
    target,
    packageJson,
    env,
    inspectTargetRoot,
    inspectTempRoot,
    createTempRoot,
    removeEmptyTempRoot,
    captureState,
    write,
  });
  const { context, workspace } = prepared;
  if (context.error) return context.error;
  if (workspace.error && !workspace.tempRoot) return workspace.error;
  const { targetRoot, assertTargetIdentity, childEnv } = context;
  const outcome = await finalizeNpmConsumerSmokeWorkspace({
    packageJson,
    context,
    workspace,
    restoreState,
    executeTransaction: async () => {
      const [command, prefix] = resolveCommand(childEnv, process.platform, process.execPath, root);
      return runSmokePackageTransaction({
        root,
        packageJson,
        run,
        command,
        prefix,
        packDirectory: workspace.packDirectory,
        targetRoot,
        assertTargetIdentity,
        env: {
          ...childEnv,
          npm_config_cache: join(workspace.tempRoot, "npm-cache"),
        },
      });
    },
  });
  return outcome;
}
