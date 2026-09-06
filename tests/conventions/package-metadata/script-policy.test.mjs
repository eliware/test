import { checkPackageScripts } from '../../../src/conventions/package-metadata/script-policy.mjs';

test('validates consumer and self-hosted scripts', () => {
  expect(checkPackageScripts({ scripts: { test: 'eliware-test', lint: 'eliware-test --lint' } })).toEqual([]);
  expect(checkPackageScripts({ scripts: { test: 'node bin/eliware-test.mjs', lint: 'node bin/eliware-test.mjs' } }, { allowSelfReference: true })).toEqual([]);
  expect(checkPackageScripts({ scripts: { test: 'eliware-test --ignore-100x4', lint: 'eliware-test --lint' } })).toHaveLength(1);
});
