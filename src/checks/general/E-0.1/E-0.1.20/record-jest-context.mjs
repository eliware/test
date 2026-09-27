import { selectJestTimingOutput } from "./select-jest-timing-output.mjs";

export function recordJestContext(context, result) {
  context.jestResult = result;
  context.jestCoverageDirectory = result.coverageDirectory;
  context.timing?.setJestOutputGetter?.(() => selectJestTimingOutput(result));
  return context;
}
