import { createConventionReaders } from '../../src/conventions/create-convention-readers.mjs';

test('caches repository text and directory reads', async () => {
  let files = 0;
  let directories = 0;
  const readers = createConventionReaders('C:/repo', async () => { files += 1; return 'text'; }, async () => { directories += 1; return []; });
  await expect(readers.read('README.md')).resolves.toBe('text');
  await expect(readers.read('README.md')).resolves.toBe('text');
  await readers.readDirectoryOnce('C:/repo/docs', {});
  await readers.readDirectoryOnce('C:/repo/docs', {});
  expect(files).toBe(1);
  expect(directories).toBe(1);
});

test('provides default filesystem collaborators', async () => {
  const readers = createConventionReaders(process.cwd());
  await expect(readers.read('missing-file')).resolves.toBe('');
  await expect(readers.readDirectoryOnce(process.cwd(), { withFileTypes: true })).resolves.toEqual(expect.any(Array));
});
