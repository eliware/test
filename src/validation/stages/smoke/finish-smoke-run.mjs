import { cleanupSmokeTempRoot } from "./cleanup-smoke-temp-root.mjs";

export async function finishSmokeRun({
  outcome,
  state,
  assertTargetIdentity,
  restoreState,
  tempRoot,
  tempIdentity,
  cleanup = cleanupSmokeTempRoot,
}) {
  let restoreError;
  if (state && !state.error) {
    try {
      await assertTargetIdentity();
      await restoreState(state);
    } catch (error) {
      restoreError = error.message;
    }
  }
  let cleanupMessage;
  try {
    cleanupMessage = await cleanup(tempRoot, tempIdentity, {
      preserve: Boolean(restoreError),
    });
  } catch (error) {
    cleanupMessage = `Temporary smoke cleanup failed: ${error.message}.`;
  }
  if (restoreError)
    return `${outcome} Target restoration failed: ${restoreError}. ${cleanupMessage}`;
  if (state && !state.error) outcome = `${outcome} Previous target package state restored.`;
  return cleanupMessage ? `${outcome} ${cleanupMessage}` : outcome;
}
