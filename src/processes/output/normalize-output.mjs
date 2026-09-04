const ANSI_ESCAPE = new RegExp(`[${String.fromCharCode(27)}\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d/#&.:=?%@~_]+)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-T-Zcf-nq-uy=><~]))`, 'g');
const PATH_TOKEN = /[A-Za-z0-9]/;

function redactWorkspacePath(output, cwd, caseInsensitive) {
  const comparableOutput = caseInsensitive ? output.replaceAll('\\', '/') : output;
  const comparableCwd = caseInsensitive ? cwd.replaceAll('\\', '/') : cwd;
  const needle = caseInsensitive ? comparableCwd.toLowerCase() : comparableCwd;
  const comparable = caseInsensitive ? comparableOutput.toLowerCase() : comparableOutput;
  let result = '';
  let cursor = 0;
  while (cursor < output.length) {
    const found = comparable.indexOf(needle, cursor);
    if (found < 0) return result + output.slice(cursor);
    const before = found === 0 ? '' : output[found - 1];
    const after = output[found + cwd.length] ?? '';
    if (!PATH_TOKEN.test(before) && !PATH_TOKEN.test(after)) {
      result += output.slice(cursor, found) + '<workspace>';
      cursor = found + cwd.length;
    } else {
      result += output.slice(cursor, found + 1);
      cursor = found + 1;
    }
  }
  return result;
}

/** Remove terminal control sequences and redact workspace paths in diagnostics. */
export function normalizeOutput(output, cwd) {
  if (typeof output !== 'string') return '';
  const normalized = output.replace(ANSI_ESCAPE, '');
  if (typeof cwd !== 'string' || cwd.length === 0) return normalized;

  const windowsPath = /^(?:[A-Za-z]:[\\/]|[/\\]{2})/.test(cwd);
  return redactWorkspacePath(normalized, cwd, windowsPath);
}
