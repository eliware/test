import cleanupSmokeTempRoot from "./cleanup-smoke-temp-root.mjs";
import attemptSmokeTargetRestoration from "./restore/attempt-target-restoration.mjs";
import formatSmokeCleanupFailure from "./finish-smoke-run/format-result.mjs";
import formatSmokeFinishResult from "./finish-smoke-run/format-result/format-smoke-finish-result.mjs";
export default async function finishSmokeRun({
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
    cleanupMessage = formatSmokeCleanupFailure(error);
  }
  return formatSmokeFinishResult(outcome, restoration.error, cleanupMessage);
}
