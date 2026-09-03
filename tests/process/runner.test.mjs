import { runProcess } from '../../src/process/runner.mjs';
test('exports the process runner', () => { expect(runProcess).toBeInstanceOf(Function); });
