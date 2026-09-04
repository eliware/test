import { cleanupCoverage } from '../../../src/public/stages/cleanup.mjs';

test('cleans every coverage candidate', async () => {
  const removed = [];
  expect(await cleanupCoverage('.', async (p) => removed.push(p), ['coverage/a', 'coverage/b', 'coverage/c'], () => {})).toBe(true);
  expect(removed).toHaveLength(3);
});

test('stops and reports the first cleanup failure', async () => {
  const messages = [];
  const removed = [];
  expect(await cleanupCoverage('.', async (path) => {
    removed.push(path);
    if (path.replaceAll('\\', '/').endsWith('coverage/b')) throw new Error('locked');
  }, ['coverage/a', 'coverage/b', 'coverage/c'], (message) => messages.push(message))).toBe(false);
  expect(removed).toHaveLength(2);
  expect(messages).toEqual(['Coverage cleanup failed: locked\n']);
});
