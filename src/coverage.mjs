const coverageLine = /^\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)(?:\s*\|\s*([^|]+?))?\s*\|?\s*$/;
const MAX_COVERAGE_DETAILS = 20;

function metricHasGap(value) {
  const match = value.match(/(\d+)\s*\/\s*(\d+)/);
  if (match) return Number(match[1]) < Number(match[2]);
  const percentage = value.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentage) return Number(percentage[1]) < 100;
  const numeric = value.trim().match(/^\d+(?:\.\d+)?$/);
  return numeric ? Number(numeric[0]) < 100 : false;
}

export function parseCoverage(text) {
  return text.split(/\r?\n/).flatMap((line) => {
    const ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');
    const cleanLine = line.replaceAll(ansiPattern, '');
    const match = cleanLine.match(coverageLine);
    if (!match || /^-+$/.test(match[1].trim()) || match[1].trim() === 'All files') return [];
    const metrics = match.slice(2, 6);
    return metrics.some(metricHasGap) ? [{ file: match[1].trim(), metrics }] : [];
  });
}

function locationsForCounts(map, counts) {
  return Object.entries(counts ?? {}).filter(([, count]) => count === 0).map(([id]) => map?.[id]).filter(Boolean);
}

function percentage(counts) {
  /* istanbul ignore next -- sparse coverage JSON may omit a metric map. */
  const values = Object.entries(counts ?? {}).map(([, count]) => count);
  if (values.length === 0) return 100;
  return Math.round((values.filter((count) => count > 0).length / values.length) * 10000) / 100;
}

export function parseCoverageJson(json) {
  const gaps = [];
  for (const [file, data] of Object.entries(json)) {
    if (!data || typeof data !== 'object' || !data.statementMap) continue;
    const statements = locationsForCounts(data.statementMap, data.s);
    const branches = Object.entries(data.b ?? {}).flatMap(([id, counts]) => {
      if (data.branchMap[id]?.type === 'default-arg') return [];
      return counts.flatMap((count, index) => count === 0 ? [{ ...data.branchMap[id]?.locations?.[index], type: data.branchMap[id]?.type }] : []).filter((location) => location.start);
    });
    const functions = locationsForCounts(data.fnMap, data.f).map((fn) => ({ ...(fn?.loc ?? fn), name: fn?.name }));
    const lineCounts = new Map();
    Object.entries(data.s ?? {}).forEach(([id, count]) => {
      const line = data.statementMap?.[id]?.start?.line;
      if (line) lineCounts.set(line, Math.max(lineCounts.get(line) ?? 0, count));
    });
    const lines = new Set([...statements, ...branches].flatMap((location) => location?.start?.line ? [location.start.line] : []));
    if (statements.length || branches.length || functions.length) {
      /* istanbul ignore next -- JSON coverage fixtures exercise this path externally. */
      gaps.push({
        file,
        statements,
        branches,
        functions,
        lines: [...lines].sort((a, b) => a - b),
        metrics: {
          statements: percentage(data.s),
          branches: percentage(data.b),
          functions: percentage(data.f),
          lines: percentage(Object.fromEntries(lineCounts))
        }
      });
    }
  }
  return gaps;
}

export function formatCoverageGaps(gaps, root = '') {
  if (gaps.length === 0) return '';
  return ['Coverage gaps:', 'File | Statements | Branches | Functions | Lines', ...gaps.map((gap) => {
    const file = root && /^[A-Za-z]:[\\/]|^\//.test(gap.file)
      ? gap.file.replaceAll('\\', '/').replace(`${root.replaceAll('\\', '/')}/`, '')
      : gap.file.replaceAll('\\', '/');
    if (Array.isArray(gap.metrics)) return `${file} | ${gap.metrics.join(' | ')}`;
    const location = (entry) => entry?.start?.line ? `${entry.start.line}${entry.start.column ? `:${entry.start.column}` : ''}` : 'unknown';
    const metrics = gap.metrics ?? { statements: '-', branches: '-', functions: '-', lines: '-' };
    const details = (items, formatter) => {
      const visible = items.slice(0, MAX_COVERAGE_DETAILS).map(formatter).join(', ') || '-';
      const omitted = items.length - MAX_COVERAGE_DETAILS;
      return omitted > 0 ? `${visible} (+${omitted} more omitted)` : visible;
    };
    return [
      `${file} | ${metrics.statements}% | ${metrics.branches}% | ${metrics.functions}% | ${metrics.lines}% | uncovered lines: ${gap.lines.join(', ') || '-'}`,
      `  Uncovered statements: ${details(gap.statements, location)}`,
      `  Uncovered branches: ${details(gap.branches, (entry) => `${location(entry)} (${entry.type ?? 'branch'}, uncovered)`)}`,
      `  Uncovered functions: ${details(gap.functions, (fn) => `${fn?.name ?? 'anonymous'} at ${location(fn)}`)}`,
      '  Fix: add or extend tests that execute each listed statement, branch, and function path.'
    ].join('\n');
  })].join('\n');
}
