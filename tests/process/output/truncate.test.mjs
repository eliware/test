import { appendBounded, boundOutput, MAX_OUTPUT } from '../../../src/process/output/truncate.mjs';
test('bounds output and appends bounded chunks', () => { expect(boundOutput('A'.repeat(MAX_OUTPUT + 10))).toContain('[Output truncated:'); expect(appendBounded('A', 'B')).toBe('AB'); });
