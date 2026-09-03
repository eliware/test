const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');

/** Detect warning-level Oxlint findings, including ANSI-colored output. */
export function detectWarnings(output) {
  if (typeof output !== 'string') throw new TypeError('detectWarnings requires output text');
  return output.split(/\r?\n/).some((line) => /(?:\b(?:warning|warn)\s*:|\b(?:oxlint|lint)\b.*\b(?:warning|warn)\b|\b(?:warning|warn)\b.*\b(?:found|violation|error)\b)/i.test(line.replace(ANSI_PATTERN, '')));
}
