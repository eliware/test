import { EXIT_CODES } from './codes.mjs';

const STAGE_CODES = Object.freeze({
  workspace: EXIT_CODES.WORKSPACE_SETUP,
  coverage: EXIT_CODES.COVERAGE_FAILURE,
  lint: EXIT_CODES.LINT_FAILURE,
  build: EXIT_CODES.BUILD_FAILURE,
  typecheck: EXIT_CODES.TYPECHECK_FAILURE,
  audit: EXIT_CODES.AUDIT_FAILURE,
  pack: EXIT_CODES.PACK_FAILURE,
  monolith: EXIT_CODES.MONOLITH_LIMIT
});

/** Map a validation-stage name to its stable wrapper exit code. */
export function classifyFailure(stage, fallback = EXIT_CODES.INTERNAL) {
  if (typeof stage !== 'string') return fallback;
  return STAGE_CODES[stage.toLowerCase()] ?? fallback;
}
