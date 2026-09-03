import { stopOnFailure } from './stop-on-failure.mjs';

/**
 * Execute validation stages in order and stop at the first non-zero result.
 *
 * The context is deliberately passed through unchanged so each stage can use
 * the shared execution services supplied by the application layer. A zero
 * result from every stage is the successful pipeline result.
 */
export async function executePipeline(context, stages) {
  if (!Array.isArray(stages)) throw new TypeError('executePipeline requires an array of stages');
  let result = 0;
  for (const stage of stages) {
    if (typeof stage !== 'function') throw new TypeError('pipeline stages must be functions');
    result = await stage(context);
    if (stopOnFailure(result)) return result;
  }
  return result;
}
