export function hasTextCoverageEvidence(output) {
  return !output.includes('[Output truncated:') && /File\s*\|\s*%\s*Stmts/i.test(output) && /\|\s*\d+(?:\.\d+)?%?(?:\s*\(\d+\s*\/\s*\d+\))?\s*\|/i.test(output);
}
