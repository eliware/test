import { collectRedactionSecrets } from "./collect-redaction-secrets.mjs";
import { normalizeRepositoryRelativePath } from "./normalize-repository-relative-path.mjs";
import { redactProcessOutput } from "./redact-process-output.mjs";

export function repositoryRelativePath(path, root = process.cwd()) {
  return normalizeRepositoryRelativePath(path, root);
}

export function createSafeReporterOutput(prefix, options = {}) {
  const write = options.write ?? ((text) => process.stderr.write(text));
  const secrets = collectRedactionSecrets(options.env ?? process.env);
  const maxOutputLength = options.maxOutputLength ?? 20_000;
  const maxLineLength = options.maxLineLength ?? 512;
  let outputLength = 0;

  return (message) => {
    const remaining = maxOutputLength - outputLength;
    if (remaining <= 0) return;
    const safeMessage = redactProcessOutput(message, secrets)
      .replace(/[\r\n]+/gu, " ")
      .slice(0, maxLineLength);
    const line = `[${prefix}] ${safeMessage}\n`.slice(0, remaining);
    write(line);
    outputLength += line.length;
  };
}
