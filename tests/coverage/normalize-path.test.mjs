import { normalizeCoveragePath } from '../../src/coverage/normalize-path.mjs';
test('normalizes workspace paths', () => expect(normalizeCoveragePath('C:\\repo\\src\\a.mjs', 'C:\\repo')).toBe('src/a.mjs'));
test('preserves unrelated and malformed paths', () => {
  expect(normalizeCoveragePath('C:/other/a.mjs', 'C:/repo')).toBe('C:/other/a.mjs');
  expect(normalizeCoveragePath('c:/REPO/src/a.mjs', 'C:\\repo')).toBe('src/a.mjs');
  expect(normalizeCoveragePath(42, 42)).toBe('unknown');
  expect(normalizeCoveragePath('/repo/a.mjs', '')).toBe('/repo/a.mjs');
});
