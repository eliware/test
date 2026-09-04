import { validateCoverage } from '../../../src/public/stages/coverage.mjs';
test('fails closed when coverage evidence is missing', async () => expect(await validateCoverage('.', '', () => {}, async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); })).toBe(10));

test('reports coverage gaps', async () => {
  const messages = [];
  const output = 'File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #\nfoo.mjs | 90 | 100 | 100 | 90 | 2';
  await expect(validateCoverage('.', output, (message) => messages.push(message), async () => '{bad')).resolves.toBe(11);
  expect(messages.join('')).toContain('foo.mjs');
});

test('normalizes coverage read failures', async () => {
  const messages = [];
  await expect(validateCoverage('.', '', (message) => messages.push(message), async () => { throw new Error('read denied'); })).resolves.toBe(10);
  expect(messages.join('')).toContain('read denied');
});

test('rejects stale JSON before falling back to text evidence', async () => {
  const messages = [];
  const report = JSON.stringify({ 'src/old.mjs': { statementMap: { 0: {} }, s: { 0: 1 }, b: {}, f: {} } });
  await expect(validateCoverage('.', 'File | % Stmts | % Branch | % Funcs | % Lines |\nfoo.mjs | 100 | 100 | 100 | 100 |', (message) => messages.push(message), async (path) => path.endsWith('coverage-final.json') ? report : '', async () => ({ mtimeMs: 1 }), 2)).resolves.toBe(0);
});
