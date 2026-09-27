export function recordJestContext(context, result) {
  context.jestResult = result;
  context.jestCoverageDirectory = result.coverageDirectory;
  context.timing?.setJestOutputGetter?.(() => result.stdout || result.stderr || "");
  return context;
}
