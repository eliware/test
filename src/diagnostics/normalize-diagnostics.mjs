const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');

/** Remove stage-specific noise and duplicate diagnostic lines. */
export function normalizeDiagnostics(output, stage) {
  const lines = output.split(/\r?\n/).filter((line) => stage !== 'Tests' || !isCoverageNoise(line));
  const seen = new Set();
  return lines.filter((line) => {
    if (!line.trim() || !seen.has(line)) { seen.add(line); return true; }
    return false;
  }).join('\n');
}

function isCoverageNoise(line) {
  const clean = line.replace(ANSI_PATTERN, '').trim();
  return clean === 'Coverage report' || clean === 'File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #'
    || /^-+(?:\s*\|\s*-+)+$/.test(clean) || /^All files\s*\|/.test(clean)
    || /\|\s*\d+(?:\.\d+)?%?(?:\s*\(\d+\/\d+\))?\s*\|/.test(clean);
}
