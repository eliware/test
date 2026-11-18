const testPathPattern = /^tests[\\/].+\.(?:test|spec)\.(?:js|jsx|ts|tsx|mjs|cjs|mts|cts)$/iu;
const absolutePathPattern = /^(?:[A-Za-z]:[\\/]|\/|\\\\)/u;

export default function getFocusedTestPaths(args = [], kind = "forwarded") {
  return args.filter((argument) =>
    kind === "positional"
      ? /^tests(?:[\\/]|$)/iu.test(argument)
      : testPathPattern.test(argument) || absolutePathPattern.test(argument),
  );
}
