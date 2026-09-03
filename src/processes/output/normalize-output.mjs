const ANSI_ESCAPE = /[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d/#&.:=?%@~_]+)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-T-Zcf-nq-uy=><~]))/g;

/** Remove terminal control sequences and redact workspace paths in diagnostics. */
export function normalizeOutput(output, cwd) {
  if (typeof output !== 'string') return '';
  const normalized = output.replace(ANSI_ESCAPE, '');
  if (typeof cwd !== 'string' || cwd.length === 0) return normalized;

  const escapedCwd = cwd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return normalized.replace(new RegExp(escapedCwd, 'gi'), '<workspace>');
}
