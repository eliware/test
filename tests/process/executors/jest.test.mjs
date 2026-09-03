import { runJest } from '../../../src/process/executors/jest.mjs';
test('exports the Jest executor', () => { expect(runJest).toBeInstanceOf(Function); });
