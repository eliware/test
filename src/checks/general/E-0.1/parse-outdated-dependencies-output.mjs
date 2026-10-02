import { collectRedactionSecrets } from "../../collect-redaction-secrets.mjs";
import { redactProcessOutput } from "../../redact-process-output.mjs";

export function parseOutdatedDependenciesOutput(stdout, stderr, code, environment) {
  if (code !== 0 && code !== 1) {
    const diagnostic = redactProcessOutput(stderr, collectRedactionSecrets(environment)).trim();
    throw new Error(diagnostic || `npm outdated exited with ${code}.`);
  }
  if (typeof stdout !== "string" || stdout.trim().length === 0) {
    const diagnostic = redactProcessOutput(stderr, collectRedactionSecrets(environment)).trim();
    throw new Error(
      diagnostic
        ? `npm outdated returned empty output: ${diagnostic}`
        : "npm outdated returned empty output.",
    );
  }
  try {
    return JSON.parse(stdout);
  } catch {
    const diagnostic = redactProcessOutput(stderr, collectRedactionSecrets(environment)).trim();
    throw new Error(
      diagnostic
        ? `npm outdated returned invalid JSON: ${diagnostic}`
        : "npm outdated returned invalid JSON.",
    );
  }
}
