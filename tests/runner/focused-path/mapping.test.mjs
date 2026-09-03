import { sourcePathForTest } from '../../../src/runner/focused-path/mapping.mjs';
test('maps a conventional test path to its source', async () => { await expect(sourcePathForTest('C:/repo', 'tests/a.test.mjs', async (path) => { if (path.replaceAll('\\', '/').endsWith('src/a.mjs')) return; throw Object.assign(new Error('missing'), { code: 'ENOENT' }); })).resolves.toBe('src/a.mjs'); });
