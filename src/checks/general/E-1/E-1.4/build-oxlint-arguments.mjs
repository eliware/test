export function buildOxlintArguments(extraArgs = []) {
  return ["--deny-warnings", ".", ...extraArgs];
}
