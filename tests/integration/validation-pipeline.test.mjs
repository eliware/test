import { executePipeline } from '../../src/application/pipeline/execute-pipeline.mjs';

test('runs stages in order and returns the final successful result', async () => {
  const calls = [];
  const result = await executePipeline({}, [
    async () => { calls.push('first'); return 0; },
    async () => { calls.push('second'); return 0; }
  ]);
  expect(calls).toEqual(['first', 'second']);
  expect(result).toBe(0);
});

test('stops immediately after the first failure', async () => {
  const calls = [];
  const result = await executePipeline({}, [
    async () => { calls.push('first'); return 7; },
    async () => { calls.push('unreachable'); return 0; }
  ]);
  expect(calls).toEqual(['first']);
  expect(result).toBe(7);
});

test('rejects malformed pipeline definitions', async () => {
  await expect(executePipeline({}, null)).rejects.toThrow(TypeError);
  await expect(executePipeline({}, [() => 0, null])).rejects.toThrow(TypeError);
});

test('treats normalized command failures as pipeline failures', async () => {
  const calls = [];
  const result = await executePipeline({}, [
    async () => ({ code: 0, output: '' }),
    async () => { calls.push('failure'); return { code: 2, output: 'failed' }; },
    async () => { calls.push('unreachable'); return 0; }
  ]);
  expect(result).toEqual({ code: 2, output: 'failed' });
  expect(calls).toEqual(['failure']);
});
