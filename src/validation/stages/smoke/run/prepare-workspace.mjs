import { mkdir, lstat } from "node:fs/promises";
import prepareSmokeTargetContext from "../prepare-smoke/target-context.mjs";
import createSmokeTempRoot from "../create-smoke-temp-root.mjs";
import prepareSmokeState from "../prepare-smoke/state.mjs";
import prepareSmokeWorkspace from "../prepare-smoke/workspace.mjs";
import assertSmokePackageParents from "../assert-smoke-package-parents.mjs";
import captureSmokeTargetState from "../capture-smoke/target-state.mjs";
export default async function prepareNpmConsumerSmokeWorkspace({
  root,
  target,
  packageJson,
  env,
  inspectTargetRoot = lstat,
  inspectTempRoot = lstat,
  createTempRoot,
  removeEmptyTempRoot,
  createTempWorkspace = createSmokeTempRoot,
  prepareState = prepareSmokeState,
  createDirectory = mkdir,
  prepareTargetContext = prepareSmokeTargetContext,
  prepareWorkspace = prepareSmokeWorkspace,
  assertPackageParents = assertSmokePackageParents,
  captureState = captureSmokeTargetState,
  write = () => {},
}) {
  const context = await prepareTargetContext({
    root,
    target,
    packageJson,
    env,
    inspectTargetRoot,
  });
  if (context.error) return { context };
  const { targetRoot, assertTargetIdentity, binNames } = context;
  const workspace = await prepareWorkspace({
    root,
    inspectTempRoot,
    createTempRoot,
    removeEmptyTempRoot,
    createTempWorkspace,
    prepareState,
    createDirectory,
    stateOptions: {
      targetRoot,
      packageJson,
      binNames,
      assertTargetIdentity,
      captureState,
      assertPackageParents,
      write,
      platform: process.platform,
    },
  });
  return { context, workspace };
}
