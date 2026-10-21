export async function formatSmokeOutcome(packageJson, runTransaction) {
  try {
    const digest = await runTransaction();
    return `Smoke passed: ${packageJson.name}@${packageJson.version}. SHA-256 ${digest}.`;
  } catch (error) {
    return `Tarball consumer smoke failed: ${error.message}`;
  }
}
