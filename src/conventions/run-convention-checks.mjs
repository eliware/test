import { runCoreConventionChecks } from './run-core-convention-checks.mjs';
import { runDocumentationConventionChecks } from './run-documentation-convention-checks.mjs';

/** Run all deterministic convention checks against one collected snapshot. */
export async function runConventionChecks(snapshot) {
  const findings = [...snapshot.findings];
  findings.push(...await runCoreConventionChecks(snapshot));
  findings.push(...await runDocumentationConventionChecks(snapshot));
  return findings;
}
