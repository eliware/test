const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');

/** Format bounded, de-duplicated child-process diagnostics. */
export function formatFailure(stage, result) {
  if (typeof stage !== 'string' || stage.length === 0) throw new TypeError('formatFailure requires a stage name');
  if (result === null || typeof result !== 'object') throw new TypeError('formatFailure requires a result object');
  const code = Number.isInteger(result.code) ? result.code : 1;
  const output = typeof result.output === 'string' ? result.output : '';
  const lines = output.split(/\r?\n/).filter((line) => stage !== 'Tests' || !isCoverageNoise(line));
  const seen = new Set();
  const diagnostics = lines.filter((line) => {
    if (!line.trim() || !seen.has(line)) { seen.add(line); return true; }
    return false;
  }).join('\n');
  return `${stage} failed (exit ${code})\n${diagnostics}`;
}

function isCoverageNoise(line) {
  const clean = line.replace(ANSI_PATTERN, '').trim();
  return clean === 'Coverage report' || clean === 'File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #'
    || /^-+(?:\s*\|\s*-+)+$/.test(clean) || /^All files\s*\|/.test(clean)
    || /\|\s*\d+(?:\.\d+)?%?(?:\s*\(\d+\/\d+\))?\s*\|/.test(clean);
}
