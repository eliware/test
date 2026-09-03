import { createStageContext, normalizeRunnerArguments } from '../../../src/runner/orchestration/context.mjs';
test('normalizes runner arguments and builds stage context', () => { expect(normalizeRunnerArguments(['--runInBand', 'tests/a.mjs', '--'])).toEqual(['tests/a.mjs']); expect(createStageContext({ cwd: 'C:/repo', write: () => {} })).toMatchObject({ cwd: 'C:/repo' }); });
