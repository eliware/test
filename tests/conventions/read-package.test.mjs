import { readConventionPackage } from '../../src/conventions/read-package.mjs';

test('reads JSON and turns absent package metadata into null', async () => {
  await expect(readConventionPackage('.', async () => '{"name":"demo"}')).resolves.toEqual({ name: 'demo' });
  await expect(readConventionPackage('.', async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); })).resolves.toBeNull();
});

test('uses the default package reader', async () => {
  await expect(readConventionPackage(process.cwd())).resolves.toMatchObject({ name: '@eliware/test' });
});

test('reports malformed package metadata without throwing', async () => {
  await expect(readConventionPackage('.', async () => '{')).resolves.toMatchObject({ __error: expect.any(String) });
  await expect(readConventionPackage('.', async () => { throw new Error('permission'); })).resolves.toMatchObject({ __error: 'permission' });
  await expect(readConventionPackage('.', async () => { throw 'permission'; })).resolves.toEqual({ __error: 'permission' });
});
