export function buildPrettierArguments({ write = false, extraArgs = [] } = {}) {
  return [write ? "--write" : "--check", ".", ...extraArgs];
}
