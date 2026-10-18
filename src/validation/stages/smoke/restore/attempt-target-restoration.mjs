export async function attemptSmokeTargetRestoration(state, assertTargetIdentity, restoreState) {
  if (!state) return { restored: false, error: "Target recovery snapshot is unavailable." };
  if (state.error) return { restored: false, error: state.error };
  try {
    await assertTargetIdentity();
    await restoreState(state);
    return { restored: true };
  } catch (error) {
    return { restored: false, error: error.message };
  }
}
