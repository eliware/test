import { normalizeDiagnostics } from './normalize-diagnostics.mjs';

/** Format bounded, de-duplicated child-process diagnostics. */
export function formatFailure(stage, result) {
  if (typeof stage !== 'string' || stage.length === 0) throw new TypeError('formatFailure requires a stage name');
  if (result === null || typeof result !== 'object') throw new TypeError('formatFailure requires a result object');
  const code = Number.isInteger(result.code) ? result.code : 1;
  const output = typeof result.output === 'string' ? result.output : '';
  const diagnostics = normalizeDiagnostics(output, stage);
  return `${stage} failed (exit ${code})\n${diagnostics}`;
}
