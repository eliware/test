import { MONOLITH_EXIT_CODE } from './constants.mjs';

export function formatMonolithViolations(violations) {
  const lines = [`Monolith limit violations (exit ${MONOLITH_EXIT_CODE})`];
  for (const violation of violations) {
    lines.push(`  ${violation.file}`, `    lines: ${violation.lines}`, `    threshold: ${violation.threshold}`, '    required action: decompose into focused modules with corresponding mirrored tests');
  }
  lines.push(`Summary: ${violations.length} violation${violations.length === 1 ? '' : 's'}`);
  return `${lines.join('\n')}\n`;
}
