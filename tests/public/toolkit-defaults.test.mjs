import { getToolkitDefaults } from '../../src/public/toolkit-defaults.mjs';
import { resolveToolkitOptions } from '../../src/public/resolve-toolkit-options.mjs';

test('provides the default collaborator set', () => {
  expect(getToolkitDefaults()).toBeTruthy();
  const defaults = getToolkitDefaults();
  expect(defaults.runTest).toEqual(expect.any(Function));
  expect(defaults.workers).toBe(6);
});

test('resolves defaults without caller options', () => {
  expect(resolveToolkitOptions()).toEqual(expect.objectContaining({ workers: 6 }));
});
