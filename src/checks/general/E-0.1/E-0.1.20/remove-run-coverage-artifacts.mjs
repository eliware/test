export async function removeRunCoverageArtifacts(context, remove) {
  if (!context.jestCoverageDirectory) return null;
  try {
    await remove(context.jestCoverageDirectory, { recursive: true, force: true });
    context.jestCoverageDirectory = undefined;
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `Could not remove run-scoped coverage artifacts: ${message}`;
  }
}
