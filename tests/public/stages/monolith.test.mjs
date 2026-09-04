import { validateMonolith } from '../../../src/public/stages/monolith.mjs';
test('passes without violations', async () => expect(await validateMonolith({ cwd: '.', findMonolith: async () => [], write: () => {}, ignoreMonolithLimits: false })).toBe(0));
test('fails on violations', async () => expect(await validateMonolith({ cwd: '.', findMonolith: async () => [{ file: 'src/large.mjs', lines: 101, threshold: 100 }], write: () => {}, ignoreMonolithLimits: false })).toBe(15));
test('reports ignored violations as success', async () => expect(await validateMonolith({ cwd: '.', findMonolith: async () => [{ file: 'src/large.mjs', lines: 101, threshold: 100 }], write: () => {}, ignoreMonolithLimits: true })).toBe(0));
test('normalizes finder failures', async () => expect(await validateMonolith({ cwd: '.', findMonolith: async () => { throw new Error('scan failed'); }, write: () => {}, ignoreMonolithLimits: false })).toBe(15));
test('rejects malformed finder results', async () => expect(await validateMonolith({ cwd: '.', findMonolith: async () => null, write: () => {}, ignoreMonolithLimits: false })).toBe(15));
