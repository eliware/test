export function recordJestContext(context, result) {
  context.jestResult = result;
  if (context.timing?.setJestOutputGetter) context.timing.setJestOutputGetter(() => result.stdout);
  else context.timing?.setJestOutput(result.stdout);
  return context;
}
