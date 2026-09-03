export function hasLintWarnings(output) {
  const ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');
  return output.split(/\r?\n/).some((line) => /(?:\b(?:warning|warn)\s*:|\b(?:oxlint|lint)\b.*\b(?:warning|warn)\b|\b(?:warning|warn)\b.*\b(?:found|violation|error)\b)/i.test(line.replace(ansiPattern, '')));
}
