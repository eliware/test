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
      // codescope ignore: restoration cannot be rolled back; retained backups are reported for recovery.
      restoreError = error.message;
    }
  }
  const cleanupMessage = await cleanup(tempRoot, tempIdentity, {
    preserve: Boolean(restoreError),
  });
  if (restoreError)
    return `${outcome} Target restoration failed: ${restoreError}. ${cleanupMessage}`;
  if (state && !state.error) outcome = `${outcome} Previous target package state restored.`;
  return cleanupMessage ? `${outcome} ${cleanupMessage}` : outcome;
}
