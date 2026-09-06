import { validateOneFocusedPath } from '../../../src/testing/focused-path/validate-one-focused-path.mjs';

test('validates a focused file inside the workspace', async () => {
  await expect(validateOneFocusedPath('/repo', 'tests/a.test.mjs', async () => {}, async () => ({ isFile: () => true }), async (path) => path)).resolves.toBe('');
});

test('rejects paths outside the workspace and preserves case-sensitive boundaries', async () => {
  await expect(validateOneFocusedPath('/repo', '../tests/outside.test.mjs', async () => {})).resolves.toBe('../tests/outside.test.mjs');
});

test('validates Windows and UNC paths', async () => {
  const accessed = [];
  const accessPath = async (path) => { accessed.push(path); };
  const file = async () => ({ isFile: () => true });
  await expect(validateOneFocusedPath('C:/repo', 'C:/repo/tests/a.test.mjs', accessPath, file, async (path) => path)).resolves.toBe('');
  await expect(validateOneFocusedPath('\\\\server\\share', '\\\\server\\share\\tests\\a.test.mjs', accessPath, file, async (path) => path)).resolves.toBe('');
  expect(accessed).toHaveLength(2);
});

test('accepts runtime path errors on Windows layouts', async () => {
  for (const code of ['UNKNOWN', 'ECONNRESET']) {
    await expect(validateOneFocusedPath('C:/repo', 'C:/repo/tests/example.test.mjs', async () => {}, async () => ({ isFile: () => true }), async () => { throw Object.assign(new Error(code), { code }); })).resolves.toBe('');
  }
});

test('rejects symlinks that resolve outside the workspace', async () => {
  const realpathPath = async (path) => path.endsWith('link.test.mjs') ? '/outside/real.test.mjs' : path;
  await expect(validateOneFocusedPath('/repo', 'tests/link.test.mjs', async () => {}, async () => ({ isFile: () => true }), realpathPath)).resolves.toBe('tests/link.test.mjs');
});

test('rechecks the physical target after access and stat', async () => {
  let calls = 0;
  const realpathPath = async (path) => { calls += 1; return calls === 3 ? '/outside/replaced.test.mjs' : path; };
  await expect(validateOneFocusedPath('/repo', 'tests/replaced.test.mjs', async () => {}, async () => ({ isFile: () => true }), realpathPath)).resolves.toBe('tests/replaced.test.mjs');
});

test('propagates initial, intermediate, and final realpath failures', async () => {
  const failure = Object.assign(new Error('realpath denied'), { code: 'EACCES' });
  await expect(validateOneFocusedPath('/repo', 'tests/a.test.mjs', async () => {}, async () => ({ isFile: () => true }), async () => { throw failure; })).rejects.toBe(failure);
  let calls = 0;
  await expect(validateOneFocusedPath('/repo', 'tests/a.test.mjs', async () => {}, async () => ({ isFile: () => true }), async (path) => { calls += 1; if (calls === 2 || calls === 3) throw failure; return path; })).rejects.toBe(failure);
});
