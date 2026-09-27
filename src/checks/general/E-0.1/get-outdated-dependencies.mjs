import { readOutdatedDependencies } from "./read-outdated-dependencies.mjs";
import { collectRedactionSecrets } from "../../collect-redaction-secrets.mjs";
import { redactProcessOutput } from "../../redact-process-output.mjs";

export function getOutdatedDependencies(context, readOutdated = readOutdatedDependencies) {
  if (context.outdatedDependencies !== undefined) {
    return Promise.resolve(context.outdatedDependencies);
  }
  context.outdatedDependenciesPromise ??= Promise.resolve().then(() =>
    readOutdated(context.root ?? process.cwd()),
  );
  return context.outdatedDependenciesPromise;
}

export function formatOutdatedDependencyError(error, environment = process.env) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return redactProcessOutput(message, collectRedactionSecrets(environment)).slice(0, 1_000) ||
    "unknown registry lookup error";
}
