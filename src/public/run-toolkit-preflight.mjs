import { EXIT_CODES } from '../exit-codes/codes.mjs';
import { validateRunnerArguments } from '../application/validate-runner-arguments.mjs';
import { prepareTests } from './stages/prepare-tests.mjs';
import { handleTestPreparation } from './stages/handle-test-preparation.mjs';
import { cleanupCoverage } from './stages/cleanup.mjs';
import { validateArchitecture } from './stages/validate-architecture.mjs';
import { COVERAGE_CANDIDATES } from '../coverage/read-coverage.mjs';

export async function runToolkitPreflight({ cwd, runnerArguments, write, accessPath, removePath, findIstanbulIgnores, inspect, debugTiming, findSourceTestMapping, timing }) {
  if (!await inspect(cwd, write, accessPath, findIstanbulIgnores)) return { exitCode: EXIT_CODES.ISTANBUL_POLICY };
  timing.step('Workspace inspection', 'tests');
  const { args, protectedArgument } = validateRunnerArguments(runnerArguments);
  if (protectedArgument) {
    write(`Unsupported Jest option: ${protectedArgument} is managed by eliware-test; remove it and use a supported filter.\n`);
    return { exitCode: EXIT_CODES.INVALID_ARGUMENT };
  }
  let preparation;
  try { preparation = await prepareTests({ cwd, args, accessPath, removePath, debugTiming }); }
  catch (error) {
    write(`Focused path validation failed: ${error.message}\n`);
    return { exitCode: EXIT_CODES.FOCUSED_PATH_VALIDATION };
  }
  const preparationOutcome = handleTestPreparation(preparation, write);
  if (preparationOutcome !== null) return { exitCode: preparationOutcome };
  if (!await cleanupCoverage(cwd, removePath, COVERAGE_CANDIDATES, write)) return { exitCode: EXIT_CODES.COVERAGE_CLEANUP };
  const architecture = await validateArchitecture(cwd, write, findSourceTestMapping);
  if (architecture) return { exitCode: architecture };
  return { args, preparation };
}
