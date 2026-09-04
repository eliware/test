import { validateFocusedPaths } from '../../src/testing/validate-focused-paths.mjs';

test('returns the first missing focused test path', async () => {
  await expect(validateFocusedPaths('C:/repo', ['tests/missing.test.mjs'], async () => {
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  })).resolves.toBe('tests/missing.test.mjs');
});

test('accepts existing focused paths', async () => {
  await expect(validateFocusedPaths('C:/repo', ['tests/example.test.mjs'], async () => undefined, async () => ({ isFile: () => true }))).resolves.toBe('');
  await expect(validateFocusedPaths('/repo', ['tests/example.test.mjs'], async () => undefined, async () => ({ isFile: () => true }))).resolves.toBe('');
  await expect(validateFocusedPaths('/repo', ['C:/repo/tests/example.test.mjs'], async () => undefined, async () => ({ isFile: () => true }))).resolves.toBe('');
});

test('rejects an existing directory as a focused file path', async () => {
  await expect(validateFocusedPaths('C:/repo', ['tests/fixtures/dir.test.mjs'], async () => undefined, async () => ({ isFile: () => false })))
    .resolves.toBe('tests/fixtures/dir.test.mjs');
});

test('validates its inputs and propagates unexpected access errors', async () => {
  await expect(validateFocusedPaths(null, [])).rejects.toThrow(TypeError);
  await expect(validateFocusedPaths('C:/repo', null)).rejects.toThrow(TypeError);
  await expect(validateFocusedPaths('C:/repo', ['tests/example.test.mjs'], async () => {
    throw Object.assign(new Error('denied'), { code: 'EACCES' });
  })).rejects.toThrow('denied');
});

test('returns no missing path without touching the filesystem', async () => {
  await expect(validateFocusedPaths('C:/repo', [], async () => { throw new Error('unexpected'); })).resolves.toBe('');
  await expect(validateFocusedPaths('C:/repo', [])).resolves.toBe('');
});

test('rejects concrete paths outside the workspace', async () => {
  let accessed = false;
  await expect(validateFocusedPaths('/repo', ['../tests/outside.test.mjs'], async () => { accessed = true; }))
    .resolves.toBe('../tests/outside.test.mjs');
  expect(accessed).toBe(false);
});

test('validates Windows and UNC paths on a non-Windows host', async () => {
  const accessed = [];
  const accessPath = async (path) => { accessed.push(path); };
  const file = async () => ({ isFile: () => true });
  await expect(validateFocusedPaths('C:/repo', ['C:/repo/tests/a.test.mjs'], accessPath, file)).resolves.toBe('');
  await expect(validateFocusedPaths('\\\\server\\share', ['\\\\server\\share\\tests\\a.test.mjs'], accessPath, file)).resolves.toBe('');
  expect(accessed).toHaveLength(2);
});

test('rejects a focused symlink that resolves outside the workspace', async () => {
  const realpathPath = async (path) => path.endsWith('link.test.mjs') ? '/outside/real.test.mjs' : path;
  await expect(validateFocusedPaths('/repo', ['tests/link.test.mjs'], async () => {}, async () => ({ isFile: () => true }), realpathPath))
    .resolves.toBe('tests/link.test.mjs');
});

test('propagates realpath failures', async () => {
  const failure = Object.assign(new Error('realpath denied'), { code: 'EACCES' });
  await expect(validateFocusedPaths('/repo', ['tests/a.test.mjs'], async () => {}, async () => ({ isFile: () => true }), async () => { throw failure; }))
    .rejects.toBe(failure);
  let calls = 0;
  await expect(validateFocusedPaths('/repo', ['tests/a.test.mjs'], async () => {}, async () => ({ isFile: () => true }), async () => {
    calls += 1;
    if (calls === 2) throw failure;
    return '/repo';
  })).rejects.toBe(failure);
});
