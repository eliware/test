/**
 * Emit diagnostics only when explicitly enabled with ELIWARE_TEST_DEBUG=1.
 * Normal successful runs therefore remain concise and quiet.
 */
export function debugOutput(write, label, value, enabled = process.env.ELIWARE_TEST_DEBUG === '1') {
  if (!enabled || typeof write !== 'function') return;
  if (label !== 'Coverage fallback' || value !== 'using Jest text coverage') return;
  write('[Coverage fallback] using Jest text coverage\n');
}
