import { runPack } from '../../src/application/run-pack.mjs';
test('runs the pack script', async () => expect(runPack('.', () => {}, { readPackageJson: async () => ({ scripts: { pack: 'pack' } }), runChildProcess: async () => ({ code: 0 }) })).resolves.toMatchObject({ code: 0, category: 'package-script', script: 'pack' }));
