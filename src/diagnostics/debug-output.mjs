/**
 * Emit diagnostics only when explicitly enabled with ELIWARE_TEST_DEBUG=1.
 * Normal successful runs therefore remain concise and quiet.
 */
export function debugOutput(write, label, value, enabled = process.env.ELIWARE_TEST_DEBUG === '1') {
  if (!enabled || typeof write !== 'function') return;
  const name = typeof label === 'string' && label.length > 0 ? label : 'debug';
  write(`[${name}] ${formatDebugValue(value)}\n`);
}

function formatDebugValue(value) {
  if (typeof value === 'string') return redactDebugText(value);
  const seen = new WeakSet();
  try {
    return JSON.stringify(value, (key, nestedValue) => {
      if (/(pass(word)?|token|secret|api[-_]?key|authorization|cookie|private[-_]?key)/i.test(key)) return '[REDACTED]';
      if (nestedValue && typeof nestedValue === 'object') {
        if (seen.has(nestedValue)) return '[Circular]';
        seen.add(nestedValue);
      }
      return nestedValue;
    });
  } catch { return '[Unserializable debug value]'; }
}

function redactDebugText(value) {
  return value
    .replace(/\bBearer\s+(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, 'Bearer [REDACTED]')
    .replace(/((?:password|token|secret|api[-_]?key|authorization|cookie|private[-_]?key)\s*[=:]\s*)(?!Bearer\b)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, '$1[REDACTED]')
    .replace(/\bsk-[A-Za-z0-9_-]+\b/g, '[REDACTED]');
}
