export function createJestCheckOptions(context, onTimeout) {
  return {
    onTimeout,
    env: context.env ?? process.env,
    writeOutput:
      context.writeOutput && context.timing?.writeNestedOutput
        ? context.timing.writeNestedOutput
        : context.writeOutput,
    onFailureDetailsReported: () => {
      context.jestFailureDetailsReported = true;
    },
    beginNestedOutput: () => context.timing?.beginNestedOutput?.(),
    elapsed: () => context.timing?.elapsed?.() ?? "0.000",
  };
}
