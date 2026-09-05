import { collectConventionInputs } from '../../src/conventions/collect-inputs.mjs';

test('collects repository inputs for convention orchestration', async () => {
  const result = await collectConventionInputs({ cwd: '.', accessPath: async () => {}, readDirectory: async () => [], readFilePath: async () => '' });
  expect(result).toEqual(expect.objectContaining({ paths: expect.any(Set), files: expect.any(Set), specFiles: expect.any(Array) }));
});

test('uses filesystem defaults when readers are omitted', async () => {
  await expect(collectConventionInputs({ cwd: '.', accessPath: async () => {}, readDirectory: async () => [] })).resolves.toEqual(expect.objectContaining({ paths: expect.any(Set) }));
});

test('honors the configured exception when collecting required-path findings', async () => {
  const result = await collectConventionInputs({
    cwd: 'repo',
    accessPath: async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); },
    readFilePath: async (path) => path.endsWith('package.json') ? JSON.stringify({ eliwareTest: { conventions: { exceptions: ['examples'] } } }) : '',
    readDirectory: async () => [],
  });
  expect(result.findings.map(({ message }) => message)).not.toContain('missing required path: examples');
});

test('selects an index overview without reading SPEC.md', async () => {
  let calls = 0;
  const readDirectory = async () => {
    calls += 1;
    return calls <= 2
      ? [{ name: 'specs', isFile: () => false, isDirectory: () => true }]
      : [{ name: 'index.md', isFile: () => true, isDirectory: () => false }];
  };
  const readFilePath = async (path) => {
    if (/specs[\\/]index\.md$/.test(path)) return 'overview';
    throw new Error('unexpected read');
  };
  const result = await collectConventionInputs({ cwd: '.', accessPath: async () => {}, readDirectory, readFilePath });
  expect(result.specText).toBe('overview');
});
