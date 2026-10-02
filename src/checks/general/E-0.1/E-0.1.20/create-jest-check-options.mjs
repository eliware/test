export function createJestCheckOptions(context, onTimeout) {
  return {
    onTimeout,
    retainCoverageDirectory: true,
    env: context.env ?? process.env,
    writeOutput:
      context.writeOutput && context.timing?.writeNestedOutput
        ? context.timing.writeNestedOutput
        : context.writeOutput,
    beginNestedOutput: () => context.timing?.beginNestedOutput?.(),
  };
}
