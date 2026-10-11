export function buildOxlintArguments(extraArgs = [], paths = []) {
  return [
    "--deny-warnings",
    "--no-error-on-unmatched-pattern",
    ...(paths.length > 0 ? paths : ["."]),
    ...extraArgs,
  ];
}
