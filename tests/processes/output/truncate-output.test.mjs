import { appendBounded, boundOutput, MAX_OUTPUT } from '../../../src/processes/output/truncate-output.mjs';

test('bounds output and appends bounded chunks', () => {
  expect(boundOutput('A'.repeat(MAX_OUTPUT + 10))).toContain('[Output truncated:');
  expect(appendBounded('A', 'B')).toBe('AB');
});

test('retains the beginning and end of oversized output', () => {
  const output = boundOutput(`start${'x'.repeat(MAX_OUTPUT)}end`);
  expect(output).toMatch(/^start/);
  expect(output).toMatch(/end$/);
  expect(output.length).toBe(MAX_OUTPUT);
});

test('handles non-string values and output at the limit', () => {
  expect(boundOutput(null)).toBe('');
  expect(appendBounded(null, null)).toBe('');
  expect(appendBounded('prefix', null)).toBe('prefix');
  expect(boundOutput('A'.repeat(MAX_OUTPUT))).toBe('A'.repeat(MAX_OUTPUT));
});

test('bounds a single oversized chunk independently of prior output', () => {
  const result = appendBounded('ignored', 'B'.repeat(MAX_OUTPUT + 100));

  expect(result).toContain('[Output truncated: 100 characters omitted.]');
  expect(result).toMatch(/^B/);
  expect(result).toMatch(/B$/);
  expect(result.length).toBe(MAX_OUTPUT);
});
