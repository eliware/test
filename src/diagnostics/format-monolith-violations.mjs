import { EXIT_CODES } from '../exit-codes/codes.mjs';

/** Format monolith-limit violations with remediation guidance. */
export function formatMonolithViolations(violations) {
  if (!Array.isArray(violations)) throw new TypeError('formatMonolithViolations requires an array');
  const lines = [`Monolith limit violations (exit ${EXIT_CODES.MONOLITH_LIMIT})`];
  for (const violation of violations) {
    lines.push(`  ${violation.file}`, `    lines: ${violation.lines}`, `    threshold: ${violation.threshold}`, '    required action: decompose into focused modules with corresponding mirrored tests');
  }
  lines.push(`Summary: ${violations.length} violation${violations.length === 1 ? '' : 's'}`);
  return `${lines.join('\n')}\n`;
}
