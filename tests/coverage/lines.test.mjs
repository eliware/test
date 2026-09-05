import { collectLineCoverage } from '../../src/coverage/lines.mjs';

test('collects authoritative Istanbul line counters', () => {
  const result = collectLineCoverage({ l: { 1: 1, 2: 0, bad: 1, 0: 1 }, statementMap: {}, s: {} });
  expect(result.lineCounts).toEqual(new Map([[1, 1], [2, 0]]));
});

test('uses statement locations when no line map exists', () => {
  const result = collectLineCoverage({
    statementMap: { 0: { start: { line: 4 } }, 1: { start: { line: 4 } }, 2: {}, 3: { start: { line: 0 } } },
    s: { 0: 1, 1: 0, 2: 0, 3: 1 }
  });
  expect(result.lineCounts.get(4)).toBe(0);
  expect(result.hasUnmappedStatement).toBe(true);
  expect(result.unmappedLineCount).toBe(2);
});

test('derives partial line coverage from valid statement locations', () => {
  const result = collectLineCoverage({
    statementMap: { 0: { start: { line: 1 } }, 1: { start: { line: 2 } } },
    s: { 0: 1, 1: 0 },
  });
  expect(result.lineCounts).toEqual(new Map([[1, 1], [2, 0]]));
  expect(result.hasUnmappedStatement).toBe(false);
});

test('counts only unmappable statements when deriving lines without an explicit map', () => {
  const result = collectLineCoverage({
    statementMap: { 0: { start: { line: 1 } }, 1: { start: { line: 2 } } },
    s: { 0: 1, 1: 1 },
  });
  expect(result.lineCounts).toEqual(new Map([[1, 1], [2, 1]]));
  expect(result.unmappedLineCount).toBe(0);
  expect(result.hasUnmappedStatement).toBe(false);
});

test('detects uncovered counters without matching statements', () => {
  const result = collectLineCoverage({ l: { 1: 1 }, statementMap: { 0: { start: { line: 1 } } }, s: { 0: 'bad', 1: 0 } });
  expect(result.hasUnmappedStatement).toBe(true);
});

test('detects covered counters without matching statements', () => {
  const result = collectLineCoverage({ l: { 1: 1 }, statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1, 1: 1 } });
  expect(result.hasUnmappedStatement).toBe(true);
});

test('handles missing locations, invalid line maps, and covered extra statements', () => {
  const result = collectLineCoverage({ l: [], statementMap: { 0: {}, 1: { start: { line: 2 } } }, s: { 0: 1, 1: 1, 2: 1 } });
  expect(result.lineCounts.size).toBe(1);
  expect(result.hasUnmappedStatement).toBe(true);
});

test('handles non-object counters and statements with null starts', () => {
  const result = collectLineCoverage({ l: { 1: 0 }, statementMap: { 0: null, 1: { start: null } }, s: null });
  expect(result.hasUnmappedStatement).toBe(true);
});

test('reports an uncovered unmappable statement with an explicit line map', () => {
  const result = collectLineCoverage({ l: { 1: 1 }, statementMap: { 0: {} }, s: { 0: 0 } });
  expect(result.hasUnmappedStatement).toBe(true);
});

test('reports a positive statement line omitted from an explicit line map', () => {
  const result = collectLineCoverage({ l: { 1: 1 }, statementMap: { 0: { start: { line: 2 } } }, s: { 0: 1 } });
  expect(result.hasUnmappedStatement).toBe(true);
  expect(result.lineCounts).toEqual(new Map([[1, 1], [2, 0]]));
});

test('keeps valid mapped zero counters as ordinary uncovered lines', () => {
  const result = collectLineCoverage({ l: { 1: 1 }, statementMap: { 0: { start: { line: 1 } } }, s: { 0: 0 } });
  expect(result.hasUnmappedStatement).toBe(false);
  expect(result.lineCounts).toEqual(new Map([[1, 1]]));
});

test('normalizes numeric-string explicit line counters consistently', () => {
  const result = collectLineCoverage({ l: { 1: '1' }, statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 } });
  expect(result.lineCounts).toEqual(new Map([[1, 1]]));
  expect(result.hasConflictingLineCoverage).toBe(false);
});

test('accepts function-valued statement counters', () => {
  const counters = () => {};
  counters[0] = 0;
  const result = collectLineCoverage({ statementMap: { 0: { start: { line: 6 } } }, s: counters });
  expect(result.lineCounts.get(6)).toBe(0);
});
