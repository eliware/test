import * as publicApi from '../index.mjs';

test('loads the declared public package entrypoint', () => {
  expect(typeof publicApi.parseArguments).toBe('function');
  expect(typeof publicApi.parseCoverage).toBe('function');
  expect(typeof publicApi.parseCoverageJson).toBe('function');
  expect(typeof publicApi.runLint).toBe('function');
  expect(typeof publicApi.runToolkit).toBe('function');
});
