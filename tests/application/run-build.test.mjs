import { runBuild } from '../../src/application/run-build.mjs';
test('runs the build script', async () => expect(runBuild('.', () => {}, { readPackageJson: async () => ({ scripts: { build: 'build' } }), runChildProcess: async () => ({ code: 0 }) })).resolves.toBe(0));
