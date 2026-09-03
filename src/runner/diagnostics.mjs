export function formatIstanbulIgnoreFailure(violations) {
  const details = violations.map(({ file, line }) => `  ${file}:${line}`).join('\n');
  return `Istanbul ignore directives are only allowed in pure barrel files:\n${details}\n`;
}

export function hasLintWarnings(output) {
  const ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');
  return output.split(/\r?\n/).some((line) => /(?:\b(?:warning|warn)\s*:|\b(?:oxlint|lint)\b.*\b(?:warning|warn)\b|\b(?:warning|warn)\b.*\b(?:found|violation|error)\b)/i.test(line.replace(ansiPattern, '')));
}

export function formatFailure(stage, result) {
  const lines = result.output.split(/\r?\n/).filter((line) => stage !== 'Tests' || !isCoverageNoise(line));
  const seen = new Set();
  const diagnostics = lines.filter((line) => {
    if (!line.trim() || !seen.has(line)) {
      seen.add(line);
      return true;
    }
    return false;
  }).join('\n');
  return `${stage} failed (exit ${result.code})\n${diagnostics}`;
}

function isCoverageNoise(line) {
  const ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');
  const clean = line.replace(ansiPattern, '').trim();
  return clean === 'Coverage report' || clean === 'File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #'
    || /^-+(?:\s*\|\s*-+)+$/.test(clean)
    || /^All files\s*\|/.test(clean)
    || /\|\s*\d+(?:\.\d+)?%?(?:\s*\(\d+\/\d+\))?\s*\|/.test(clean);
}
