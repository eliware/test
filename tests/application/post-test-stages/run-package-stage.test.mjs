import { runPackageStage } from '../../../src/application/post-test-stages/run-package-stage.mjs';
import { jest } from '@jest/globals';

test('delegates configured package checks', async () => {
  const runChildProcess = jest.fn(async () => ({ code: 0, output: '' }));
  await expect(runPackageStage({ cwd: '.', write: () => {}, packageChecks: { readPackageJson: async () => ({ scripts: { audit: 'audit', pack: 'pack', build: 'build', typecheck: 'typecheck' } }), runChildProcess } })).resolves.toBe(0);
  await expect(runPackageStage({ cwd: '.', write: () => {} })).resolves.toBe(0);
});
