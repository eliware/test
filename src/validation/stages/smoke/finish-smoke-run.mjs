import { cleanupSmokeTempRoot } from "./cleanup-smoke-temp-root.mjs";
import { attemptSmokeTargetRestoration } from "./restore/attempt-target-restoration.mjs";

export async function finishSmokeRun({
  outcome,
  state,
  assertTargetIdentity,
  restoreState,
  tempRoot,
  tempIdentity,
  cleanup = cleanupSmokeTempRoot,
}) {
  const restoration = await attemptSmokeTargetRestoration(
    state,
    assertTargetIdentity,
    restoreState,
  );
  let cleanupMessage;
  try {
    cleanupMessage = await cleanup(tempRoot, tempIdentity, {
      preserve: Boolean(restoration.error),
    });
  } catch (error) {
    cleanupMessage = `Temporary smoke cleanup failed: ${error.message}.`;
  }
  if (restoration.error)
    return `${outcome} Target restoration failed: ${restoration.error}. ${cleanupMessage}`;
  const restoredOutcome = `${outcome} Previous target package state restored.`;
  return cleanupMessage ? `${restoredOutcome} ${cleanupMessage}` : restoredOutcome;
}
