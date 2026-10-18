export async function attemptSmokeTargetRestoration(state, assertTargetIdentity, restoreState) {
  if (!state || state.error) return { restored: false };
  try {
    await assertTargetIdentity();
    await restoreState(state);
    return { restored: true };
  } catch (error) {
    return { restored: false, error: error.message };
  }
}
