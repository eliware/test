import { runTypecheck } from '../../src/application/run-typecheck.mjs';
test('runs the typecheck script', async () => expect(runTypecheck('.', () => {}, { readPackageJson: async () => ({ scripts: { typecheck: 'typecheck' } }), runChildProcess: async () => ({ code: 0 }) })).resolves.toBe(0));
