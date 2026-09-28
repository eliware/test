export function createJestCheckOptions(context, onTimeout) {
  return {
    onStderr: context.writeOutput,
    onTimeout,
    retainCoverageDirectory: true,
    env: context.env ?? process.env,
  };
}
