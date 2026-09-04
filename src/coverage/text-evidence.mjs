const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');
const METRIC = /^\s*\d+(?:\.\d+)?%?(?:\s*\(\d+\s*\/\s*\d+\))?\s*$/;

export function hasTextCoverageEvidence(output) {
  if (typeof output !== 'string' || output.includes('[Output truncated:')) return false;
  const clean = output.replace(ANSI_PATTERN, '');
  const header = /File\s*\|\s*% Stmts\s*\|\s*% Branch\s*\|\s*% Funcs\s*\|\s*% Lines/i.test(clean);
  const row = clean.split(/\r?\n/).some((line) => {
    const columns = line.split('|').slice(1, 5);
    return columns.length === 4 && columns.every((metric) => METRIC.test(metric));
  });
  return header && row;
}
