import { detectWarnings } from './detect-warnings.mjs';

export function normalizeLintResult(result) {
  return { ...result, code: Number.isInteger(result?.code) && result.code >= 0 ? result.code : 1, output: typeof result?.output === 'string' ? result.output : '' };
}
export function lintFailed(result) { return result.code !== 0 || detectWarnings(result.output); }
