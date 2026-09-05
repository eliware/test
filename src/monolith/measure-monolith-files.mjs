import { measureMonolithFile } from './measure-file.mjs';

export const DEFAULT_MEASUREMENT_WORKERS = 6;

export async function measureMonolithFiles(candidates, readSource, workers = DEFAULT_MEASUREMENT_WORKERS) {
  const measured = Array.from({ length: candidates.length });
  if (candidates.length === 1) return [await measureMonolithFile(candidates[0], readSource)];
  let next = 0;
  async function worker() {
    while (next < candidates.length) {
      const index = next; next += 1;
      measured[index] = await measureMonolithFile(candidates[index], readSource);
    }
  }
  await Promise.all(Array.from({ length: Math.min(workers, candidates.length) }, worker));
  return measured;
}
