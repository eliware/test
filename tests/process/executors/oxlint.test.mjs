import { runOxlint } from '../../../src/process/executors/oxlint.mjs';
test('exports the Oxlint executor', () => { expect(runOxlint).toBeInstanceOf(Function); });
