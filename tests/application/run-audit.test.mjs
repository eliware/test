import { runAudit } from '../../src/application/run-audit.mjs';
test('runs the audit script', async () => expect(runAudit('.', () => {}, { readPackageJson: async () => ({ scripts: { audit: 'audit' } }), runChildProcess: async () => ({ code: 0 }) })).resolves.toBe(0));
