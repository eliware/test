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
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
