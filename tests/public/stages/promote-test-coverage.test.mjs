import { promoteTestCoverage } from '../../../src/public/stages/promote-test-coverage.mjs';

test('reports missing isolated output without failing', async () => {
  const messages = [];
  await expect(promoteTestCoverage('repo', 'temp', async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); }, async () => {}, async () => {}, (message) => messages.push(message))).resolves.toBeUndefined();
  expect(messages.join('')).toContain('no isolated coverage directory');
});

test('normalizes promotion failures to coverage cleanup', async () => {
  await expect(promoteTestCoverage('repo', 'temp', async () => true, async () => {}, async () => { throw new Error('locked'); }, () => {})).resolves.toEqual({ code: 7 });
});
