import { normalizeDiagnostics } from './normalize-diagnostics.mjs';
import { normalizeOutput } from '../processes/output/normalize-output.mjs';

/** Format bounded, de-duplicated child-process diagnostics. */
export function formatFailure(stage, result, cwd) {
  if (typeof stage !== 'string' || stage.length === 0) throw new TypeError('formatFailure requires a stage name');
  if (result === null || typeof result !== 'object') throw new TypeError('formatFailure requires a result object');
  const code = Number.isInteger(result.code) ? result.code : 1;
  const output = typeof result.output === 'string' ? result.output : '';
  const diagnostics = normalizeDiagnostics(normalizeOutput(output, cwd), stage);
  return `${stage} failed (exit ${code})\n${diagnostics}`;
}
