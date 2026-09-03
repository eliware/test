const MAX_COVERAGE_DETAILS = 20;

/** Format coverage gaps as concise, actionable diagnostics. */
export function formatCoverageGaps(gaps, root = '') {
  if (!Array.isArray(gaps)) throw new TypeError('formatCoverageGaps requires an array');
  if (typeof root !== 'string') throw new TypeError('formatCoverageGaps root must be a string');
  if (gaps.length === 0) return '';
  return ['Coverage gaps:', 'File | Statements | Branches | Functions | Lines', ...gaps.map((gap) => {
    const normalizedFile = typeof gap?.file === 'string' ? gap.file.replaceAll('\\', '/') : 'unknown';
    const normalizedRoot = root.replaceAll('\\', '/').replace(/\/+$/, '');
    const rootPrefix = `${normalizedRoot}/`;
    const file = normalizedRoot && /^[A-Za-z]:[\\/]|^\//.test(normalizedFile) && normalizedFile.startsWith(rootPrefix)
      ? normalizedFile.slice(rootPrefix.length) : normalizedFile;
    if (Array.isArray(gap.metrics)) return `${file} | ${gap.metrics.join(' | ')}`;
    const location = (entry) => entry?.start?.line ? `${entry.start.line}${entry.start.column ? `:${entry.start.column}` : ''}` : 'unknown';
    const metrics = gap.metrics ?? { statements: '-', branches: '-', functions: '-', lines: '-' };
    const details = (items, formatter) => {
      const visibleItems = (Array.isArray(items) ? items : []).slice(0, MAX_COVERAGE_DETAILS);
      const visible = visibleItems.map(formatter).join(', ') || '-';
      const omitted = (Array.isArray(items) ? items.length : 0) - MAX_COVERAGE_DETAILS;
      return omitted > 0 ? `${visible} (+${omitted} more omitted)` : visible;
    };
    return [`${file} | ${metrics.statements}% | ${metrics.branches}% | ${metrics.functions}% | ${metrics.lines}% | uncovered lines: ${(Array.isArray(gap.lines) ? gap.lines : []).join(', ') || '-'}`, `  Uncovered statements: ${details(gap.statements, location)}`, `  Uncovered branches: ${details(gap.branches, (entry) => `${location(entry)} (${entry.type ?? 'branch'}, uncovered)`)}`, `  Uncovered functions: ${details(gap.functions, (fn) => `${fn?.name ?? 'anonymous'} at ${location(fn)}`)}`, '  Fix: add or extend tests that execute each listed statement, branch, and function path.'].join('\n');
  }), '', 'Remediation: Add tests to improve coverage. Refactor the implementation if necessary to ensure proper testability. Remove any truly unreachable branches. Istanbul ignore directives are authorized only in pure barrel files.'].join('\n');
}
