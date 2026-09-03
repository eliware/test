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
