export function buildPrettierArguments({ write = false } = {}) {
  return [write ? "--write" : "--check", "."];
}
