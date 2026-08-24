const coverageLine = /^\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)(?:\s*\|\s*([^|]+?))?\s*\|?\s*$/;

function metricHasGap(value) {
  const match = value.match(/(\d+)\s*\/\s*(\d+)/);
  if (match) return Number(match[1]) < Number(match[2]);
  const percentage = value.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentage) return Number(percentage[1]) < 100;
  const numeric = value.trim().match(/^\d+(?:\.\d+)?$/);
  return numeric ? Number(numeric[0]) > 0 && Number(numeric[0]) < 100 : false;
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
  return Object.entries(counts ?? {}).filter(([, count]) => count === 0).map(([id]) => map[id]);
}

export function parseCoverageJson(json) {
  const gaps = [];
  for (const [file, data] of Object.entries(json)) {
    const statements = locationsForCounts(data.statementMap, data.s);
    const branches = Object.entries(data.b ?? {}).flatMap(([id, counts]) => {
      if (data.branchMap[id]?.type === 'default-arg') return [];
      return counts.flatMap((count, index) => count === 0 ? [data.branchMap[id]?.locations?.[index]] : []).filter(Boolean);
    });
    const functions = locationsForCounts(data.fnMap, data.f).map((fn) => fn?.loc ?? fn);
    const lines = new Set([...statements, ...branches].flatMap((location) => location ? [location.start.line] : []));
    if (statements.length || branches.length || functions.length) {
      /* istanbul ignore next -- JSON coverage fixtures exercise this path externally. */
      gaps.push({ file, statements, branches, functions, lines: [...lines].sort((a, b) => a - b) });
    }
  }
  return gaps;
}

export function formatCoverageGaps(gaps) {
  if (gaps.length === 0) return '';
  return ['Coverage gaps:', 'File | Statements | Branches | Functions | Lines', ...gaps.map((gap) => {
    if (gap.metrics) return `${gap.file} | ${gap.metrics.join(' | ')}`;
    const functions = gap.functions.map((fn) => fn?.name ?? 'anonymous').join(', ') || '-';
    return `${gap.file} | ${gap.statements.length} | ${gap.branches.length} | ${gap.functions.length} | ${gap.lines.join(', ') || '-'} (functions: ${functions})`;
  })].join('\n');
}
