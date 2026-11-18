function formatSmokeFinishResult(outcome, restorationError, cleanupMessage) {
  if (restorationError)
    return `${outcome} Target restoration failed: ${restorationError}. ${cleanupMessage}`;
  const restoredOutcome = `${outcome} Previous target package state restored.`;
  return cleanupMessage ? `${restoredOutcome} ${cleanupMessage}` : restoredOutcome;
}
export default formatSmokeFinishResult;
