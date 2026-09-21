export function buildPackArguments(extraArgs = []) {
  return ["pack", "--dry-run", "--json", ...extraArgs];
}
