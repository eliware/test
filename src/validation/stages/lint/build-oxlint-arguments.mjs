export function buildOxlintArguments(extraArgs = [], paths = []) {
  return ["--deny-warnings", ...(paths.length > 0 ? paths : ["."]), ...extraArgs];
}
