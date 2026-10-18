import { join } from "node:path";

export async function prepareSmokeWorkspace({
  root,
  inspectTempRoot,
  createTempRoot,
  removeEmptyTempRoot,
  createTempWorkspace,
  prepareState,
  createDirectory,
  stateOptions,
}) {
  const tempState = await createTempWorkspace(
    root,
    inspectTempRoot,
    createTempRoot,
    removeEmptyTempRoot,
  );
  if (tempState.error) return { error: tempState.error };

  const { path: tempRoot, identity: tempIdentity } = tempState;
  const packDirectory = join(tempRoot, "pack");
  const backupDirectory = join(tempRoot, "backup");
  let state;
  try {
    state = await prepareState({ ...stateOptions, backupDirectory, createDirectory });
    await createDirectory(packDirectory);
    return { tempRoot, tempIdentity, packDirectory, state };
  } catch (error) {
    return { tempRoot, tempIdentity, packDirectory, state, error };
  }
}
