export function buildPrettierArguments({ write = false, extraArgs = [], paths = [] } = {}) {
  return [write ? "--write" : "--check", ...(paths.length > 0 ? paths : ["."]), ...extraArgs];
}
