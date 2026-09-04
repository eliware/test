import { EXIT_CODES } from '../../exit-codes/codes.mjs';
import { formatMonolithViolations } from '../../diagnostics/format-monolith-violations.mjs';
export async function validateMonolith({ cwd, findMonolith, monolithOptions = {}, write, ignoreMonolithLimits }) {
  try { const violations = await findMonolith(cwd, monolithOptions); if (!Array.isArray(violations)) throw new TypeError('monolith collaborator returned an invalid result'); if (violations.length) { write(formatMonolithViolations(violations)); if (!ignoreMonolithLimits) return EXIT_CODES.MONOLITH_LIMIT; write('Monolith limits ignored for this diagnostic/refactoring run.\n'); } return 0; }
  catch (error) { write(`Monolith validation failed: ${error.message}\n`); return EXIT_CODES.MONOLITH_LIMIT; }
}
