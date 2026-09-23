export function recordJestContext(context, result) {
  context.jestResult = result;
  context.timing?.setJestOutputGetter?.(() => result.stdout);
  return context;
}
