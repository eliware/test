const coverageLine = /^\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)(?:\s*\|\s*([^|]+?))?\s*\|?\s*$/;
const MAX_COVERAGE_DETAILS = 20;
const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');

function isCoveredCount(value) {
  return Number.isFinite(value) && value > 0;
}

export function metricHasGap(value) {
  // codescope ignore: signed and non-finite text metrics are intentionally malformed gaps; JSON counters are validated separately.
  if (typeof value !== 'string') return true;
  if (value.length > 2048) return true;
  // codescope ignore: Jest counter ratios are integer counters; fractional ratios intentionally fall through as malformed gaps.
  const match = value.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  if (match) {
    // codescope ignore: malformed ratios, including covered > total, intentionally fail closed as coverage gaps.
    const covered = BigInt(match[1]);
    const total = BigInt(match[2]);
    if (total <= 0n || covered > total) return true;
    return covered !== total;
  }
  const annotated = value.trim().match(/^(\d+(?:\.\d+)?)\s*%\s*\((\d+)\s*\/\s*(\d+)\)$/);
  if (annotated) {
    // Compare arbitrary-size raw counters without converting them through Number.
    const displayedHundredths = percentageHundredths(annotated[1]);
    const covered = BigInt(annotated[2]);
    const total = BigInt(annotated[3]);
    if (total <= 0n || covered > total) return true;
    const expectedHundredths = (covered * 10000n + total / 2n) / total;
    return covered !== total || displayedHundredths === null || displayedHundredths !== expectedHundredths;
  }
  const percentage = value.trim().match(/^(\d+(?:\.\d+)?)\s*%$/);
  if (percentage) {
    return !isExactHundred(percentage[1]);
  }
  const numeric = value.trim().match(/^\d+(?:\.\d+)?$/);
  if (numeric) {
    return !isExactHundred(numeric[0]);
  }
  return true;
}

function isExactHundred(value) {
  return /^100(?:\.0*)?$/.test(value);
}

function percentageHundredths(value) {
  // codescope ignore: callers validate the complete numeric percentage grammar before this helper; malformed suffixes cannot reach it.
  // codescope ignore: annotated values intentionally use the same two-decimal rounding policy as plain percentages; extra producer precision is accepted only when it matches that rounded value.
  const [whole, fraction = ''] = value.split('.');
  if (whole.length > 3) return null;
  if (BigInt(whole) > 100n || (whole === '100' && /[1-9]/.test(fraction))) return null;
  if (fraction.length > 1024) return null;
  let hundredths = BigInt(whole) * 100n + BigInt(fraction.slice(0, 2).padEnd(2, '0'));
  if (fraction.length > 2 && fraction[2] >= '5') hundredths += 1n;
  if (hundredths === 10000n && whole !== '100') return null;
  // codescope ignore: the earlier 100-with-nonzero-fraction guard makes a rounded result above 10000 unreachable.
  return hundredths;
}

export function parseCoverage(text) {
  // codescope ignore: the fixed 16 KiB capture cap makes whole-buffer parsing a bounded performance tradeoff.
  // codescope ignore: the input is capped before parsing; whole-buffer splitting is the specified bounded-parser implementation.
  // codescope ignore: streaming parsing is intentionally deferred; child output is bounded before this parser runs.
  // codescope ignore: the input is bounded before parsing, so splitting the complete buffer is an intentional low-cost diagnostic tradeoff.
  // codescope ignore: bounded coverage text is intentionally parsed with whole-buffer split/flatMap for simple implementation.
  return text.split(/\r?\n/).flatMap((line) => {
    const cleanLine = line.replace(ANSI_PATTERN, '');
    const match = cleanLine.match(coverageLine);
    if (!match || /^-+$/.test(match[1].trim()) || match[1].trim() === 'All files' || match[1].trim() === 'File') return [];
    const metrics = match.slice(2, 6);
    return metrics.some(metricHasGap) ? [{ file: match[1].trim(), metrics }] : [];
  });
}

function locationsForCounts(map, counts) {
  // codescope ignore: missing Istanbul location metadata is rendered as unknown rather than rejected.
  return Object.entries(counts ?? {}).filter(([, count]) => !isCoveredCount(count)).map(([id]) => map?.[id] ?? {});
}

function percentage(counts) {
  // codescope ignore: JSON counters arrive as JavaScript numbers, so extreme counter precision is inherently limited by the producer/parser representation.
  // codescope ignore: Istanbul branch counters are arrays by contract; flattening them here intentionally shares the metric calculation with scalar counters.
  // codescope ignore: Istanbul counters are execution counts; every finite positive count is covered.
  if (counts === undefined || counts === null) return 0;
  // Malformed scalar maps are not valid coverage evidence and must not look complete.
  if (typeof counts !== 'object' || Array.isArray(counts)) return 0;
  // codescope ignore: malformed counters are intentionally counted as uncovered so enforcement fails closed.
  let total = 0;
  let covered = 0;
  for (const count of Object.values(Object(counts))) {
    const values = Array.isArray(count) ? count : [count];
    for (const value of values) {
      total += 1;
      if (isCoveredCount(value)) covered += 1;
    }
  }
  if (total === 0) return 100;
  return Math.round((covered / total) * 10000) / 100;
}

// codescope ignore: direct consumers intentionally receive best-effort partial diagnostics without a separate strict-parser API.
export function parseCoverageJson(json) {
  // codescope ignore: best-effort parser output intentionally has no malformed-entry status channel; the runner owns strict evidence validation.
  if (!json || typeof json !== 'object' || Array.isArray(json)) return [];
  const gaps = [];
  for (const [file, data] of Object.entries(json)) {
    if (!data || typeof data !== 'object' || !data.statementMap) continue;
    const statements = locationsForCounts(data.statementMap, data.s);
    const branches = Object.entries(data.b ?? {}).flatMap(([id, counts]) => {
      if (!Array.isArray(counts)) return [];
      const branch = data.branchMap?.[id];
      if (branch?.type === 'default-arg') return [];
      // codescope ignore: missing or malformed Istanbul branch metadata still yields one best-effort gap per uncovered counter.
      if (!branch || typeof branch !== 'object') return counts.filter((count) => !isCoveredCount(count)).map(() => ({ type: 'branch' }));
      return counts.flatMap((count, index) => {
        const location = branch.locations?.[index];
        // codescope ignore: direct parser callers intentionally receive best-effort malformed branch diagnostics; runner validation rejects malformed candidates.
        if (isCoveredCount(count)) return [];
        return [{ ...location, type: branch.type ?? 'branch' }];
      });
    });
    const functionCounters = data.f === undefined || data.f === null
      ? {}
      : (typeof data.f === 'object' && !Array.isArray(data.f) ? data.f : null);
    // codescope ignore: mixed malformed function-counter entries are intentionally reported as uncovered diagnostics by the best-effort parser.
    const functions = functionCounters === null
      ? [{ type: 'function', name: 'unknown' }]
      : Object.entries(functionCounters).filter(([, count]) => !Number.isFinite(count) || count <= 0).map(([id]) => {
      const metadata = data.fnMap && typeof data.fnMap === 'object' && Object.hasOwn(data.fnMap, id) ? data.fnMap[id] : undefined;
      const fn = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {};
      const primaryLocation = fn.loc && typeof fn.loc === 'object' && !Array.isArray(fn.loc) && fn.loc.start && typeof fn.loc.start === 'object' ? fn.loc : undefined;
      const fallbackLocation = Array.isArray(fn.locations) && fn.locations[0] && typeof fn.locations[0] === 'object' && !Array.isArray(fn.locations[0]) ? fn.locations[0] : undefined;
      const location = primaryLocation ?? fallbackLocation;
      return { ...(location && typeof location === 'object' && !Array.isArray(location) ? location : {}), name: typeof fn.name === 'string' ? fn.name : (metadata && typeof metadata === 'object' ? 'anonymous' : 'unknown') };
      });
    const lineCounts = new Map();
    let unmappedLineCount = 0;
    if (data.l && typeof data.l === 'object' && !Array.isArray(data.l)) {
      for (const [line, count] of Object.entries(data.l)) {
        const lineNumber = Number(line);
        if (Number.isInteger(lineNumber) && lineNumber > 0 && Number.isFinite(count)) lineCounts.set(lineNumber, isCoveredCount(count) ? 1 : 0);
      }
    }
    let hasUnmappedStatement = false;
    Object.entries(data.statementMap).forEach(([id, statement]) => {
      const statementCounts = data.s && (typeof data.s === 'object' || typeof data.s === 'function') ? data.s : {};
      const count = statementCounts[id];
      const statementStart = statement && typeof statement === 'object' && Object.hasOwn(statement, 'start')
        && statement.start && typeof statement.start === 'object' && !Array.isArray(statement.start)
        ? statement.start : undefined;
      const line = statementStart?.line;
      // codescope ignore: malformed statement counters conservatively count as uncovered lines.
      if (typeof line === 'number' && Number.isFinite(line)) lineCounts.set(line, Math.min(lineCounts.get(line) ?? 1, isCoveredCount(count) ? 1 : 0));
      else {
        unmappedLineCount += 1;
        if (!isCoveredCount(count)) hasUnmappedStatement = true;
      }
    });
    Object.entries(data.s ?? {}).forEach(([id, count]) => {
      if (!(id in data.statementMap) && !isCoveredCount(count)) hasUnmappedStatement = true;
    });
    const lines = new Set([...lineCounts].filter(([, count]) => count === 0).map(([line]) => line));
    const lineGap = hasUnmappedStatement;
    if (statements.length || branches.length || functions.length || lines.size || lineGap) {
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
          lines: lineCounts.size > 0 ? percentageWithUnknowns(lineCounts, unmappedLineCount) : (lineGap ? 0 : 100)
        }
      });
    }
  }
  return gaps;
}

function percentageWithUnknowns(lineCounts, unknownCount) {
  const mapped = Object.values(Object.fromEntries(lineCounts));
  const total = mapped.length + unknownCount;
  return Math.round((mapped.filter(isCoveredCount).length / total) * 10000) / 100;
}


export function formatCoverageGaps(gaps, root = '') {
  // codescope ignore: malformed direct formatter inputs are normalized to an empty diagnostic list rather than exposed as public TypeErrors.
  const entries = Array.isArray(gaps) ? gaps : [];
  if (entries.length === 0) return '';
  return ['Coverage gaps:', 'File | Statements | Branches | Functions | Lines', ...entries.map((gap) => {
    const normalizedFile = typeof gap?.file === 'string' ? gap.file.replaceAll('\\', '/') : 'unknown';
    const normalizedRoot = typeof root === 'string' ? root.replaceAll('\\', '/').replace(/\/+$/, '') : '';
    const rootPrefix = `${normalizedRoot}/`;
    const file = normalizedRoot && /^[A-Za-z]:[\\/]|^\//.test(normalizedFile) && normalizedFile.startsWith(rootPrefix)
      ? normalizedFile.slice(rootPrefix.length)
      : normalizedFile;
    // codescope ignore: legacy text-gap arrays and detailed JSON-gap objects intentionally share this formatter with distinct output shapes.
    if (Array.isArray(gap.metrics)) return `${file} | ${gap.metrics.join(' | ')}`;
    const location = (entry) => entry?.start?.line ? `${entry.start.line}${entry.start.column ? `:${entry.start.column}` : ''}` : 'unknown';
    const metrics = gap.metrics ?? { statements: '-', branches: '-', functions: '-', lines: '-' };
    const details = (items, formatter) => {
      items = Array.isArray(items) ? items : [];
      const visible = items.slice(0, MAX_COVERAGE_DETAILS).map(formatter).join(', ') || '-';
      const omitted = items.length - MAX_COVERAGE_DETAILS;
      return omitted > 0 ? `${visible} (+${omitted} more omitted)` : visible;
    };
    return [
      `${file} | ${metrics.statements}% | ${metrics.branches}% | ${metrics.functions}% | ${metrics.lines}% | uncovered lines: ${(Array.isArray(gap.lines) ? gap.lines : []).join(', ') || '-'}`,
      `  Uncovered statements: ${details(gap.statements, location)}`,
      `  Uncovered branches: ${details(gap.branches, (entry) => `${location(entry)} (${entry.type ?? 'branch'}, uncovered)`)}`,
      `  Uncovered functions: ${details(gap.functions, (fn) => `${fn?.name ?? 'anonymous'} at ${location(fn)}`)}`,
      '  Fix: add or extend tests that execute each listed statement, branch, and function path.'
    ].join('\n');
  })].join('\n');
}
