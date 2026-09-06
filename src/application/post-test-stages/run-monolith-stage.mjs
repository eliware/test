import { validateMonolith } from '../../public/stages/monolith.mjs';

/** Run the optional post-test monolith stage. */
export async function runMonolithStage({ cwd, write, enforceMonolithLimits, findMonolith, monolithOptions = {}, ignoreMonolithLimits }) {
  if (!enforceMonolithLimits) return 0;
  return validateMonolith({ cwd, findMonolith, monolithOptions, write, ignoreMonolithLimits });
}
