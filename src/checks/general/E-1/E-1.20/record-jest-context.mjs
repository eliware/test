export function recordJestContext(context, result) {
  context.jestResult = result;
  context.timing?.setJestOutput(result.stdout);
  return context;
}
