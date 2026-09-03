import { runValidationPipeline } from '../../../src/runner/orchestration/pipeline.mjs';
test('stops validation at the first failure', async () => { const calls = []; await expect(runValidationPipeline({}, [async () => { calls.push(1); return 0; }, async () => { calls.push(2); return 3; }, async () => { calls.push(3); return 0; }])).resolves.toBe(3); expect(calls).toEqual([1, 2]); });
