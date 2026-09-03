import { readPackageJson } from '../../src/workspace/read-package-json.mjs';

test('validates the working directory and file reader', async () => {
  await expect(readPackageJson('')).rejects.toThrow(TypeError);
  await expect(readPackageJson(null)).rejects.toThrow(TypeError);
  await expect(readPackageJson('C:/repo', null)).rejects.toThrow(TypeError);
});

test('reads and parses package metadata', async () => {
  await expect(readPackageJson('C:/repo', async () => JSON.stringify({ name: 'fixture' })))
    .resolves.toEqual({ name: 'fixture' });
});

test('returns null when package metadata is absent', async () => {
  const error = Object.assign(new Error('missing'), { code: 'ENOENT' });
  await expect(readPackageJson('C:/repo', async () => { throw error; })).resolves.toBeNull();
});

test('propagates malformed JSON and unexpected read errors', async () => {
  await expect(readPackageJson('C:/repo', async () => '{invalid')).rejects.toThrow(SyntaxError);
  await expect(readPackageJson('C:/repo', async () => { throw new Error('denied'); })).rejects.toThrow('denied');
});
