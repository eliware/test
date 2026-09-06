import { readFile } from 'node:fs/promises';
import { collectConventionInputs } from './collect-inputs.mjs';
import { formatConventionFindings } from './format-findings.mjs';
import { runConventionChecks } from './run-convention-checks.mjs';

export function finishConventionValidation(findings, write) {
  if (!findings.length) return true;
  write(formatConventionFindings(findings));
  return findings.every(({ severity }) => severity === 'warning');
}

/** Coordinate deterministic convention checks over one collected repository snapshot. */
export async function validateConventions({ cwd, write, accessPath, readFilePath = readFile, readDirectory, allowCoverageOptOut = false, allowMonolithOptOut = false }) {
  const packageJson = await (async () => {
    try { return await collectConventionInputs({ cwd, accessPath, readFilePath, readDirectory }); }
    catch (error) {
      const findings = [{ group: 'structure', code: 'WORKSPACE_TRAVERSAL_FAILED', message: `workspace traversal failed: ${error.message}` }];
      write(formatConventionFindings(findings));
      return null;
    }
  })();
  if (!packageJson) return false;
  return finishConventionValidation(await runConventionChecks({ ...packageJson, allowCoverageOptOut, allowMonolithOptOut }), write);
}
