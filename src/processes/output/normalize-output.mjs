const ANSI_ESCAPE = new RegExp(`[${String.fromCharCode(27)}\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d/#&.:=?%@~_]+)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-T-Zcf-nq-uy=><~]))`, 'g');

/** Remove terminal control sequences and redact workspace paths in diagnostics. */
export function normalizeOutput(output, cwd) {
  if (typeof output !== 'string') return '';
  const normalized = output.replace(ANSI_ESCAPE, '');
  if (typeof cwd !== 'string' || cwd.length === 0) return normalized;

  const escapedCwd = cwd.replace(/[.*+?^${}()|[\][\\]/g, '\\$&');
  const windowsPath = /^(?:[A-Za-z]:[\\/]|[/\\]{2})/.test(cwd);
  const pathPattern = `(?<![A-Za-z0-9])${escapedCwd}(?![A-Za-z0-9])`;
  return normalized.replace(new RegExp(pathPattern, windowsPath ? 'gi' : 'g'), '<workspace>');
}
