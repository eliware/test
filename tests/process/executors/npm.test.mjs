import { npmInvocation, runNpm } from '../../../src/process/executors/npm.mjs';
test('exports npm execution helpers', () => { expect(npmInvocation(['--version'])[0]).toBe(process.execPath); expect(runNpm).toBeInstanceOf(Function); });
