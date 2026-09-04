import { readPolicySources } from '../../../src/workspace/policy/read-policy-sources.mjs';

test('reads sources with bounded concurrency and preserves result order', async () => {
  let active = 0;
  let maximum = 0;
  const files = Array.from({ length: 7 }, (_, index) => ({ root: 'C:/repo', path: `C:/repo/${index}.mjs` }));
  const results = await readPolicySources(files, async (path) => path, async (_root, path, source) => {
    active += 1;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 1));
    active -= 1;
    return source;
  });
  expect(results).toEqual(files.map(({ path }) => path));
  expect(maximum).toBeLessThanOrEqual(6);
});
