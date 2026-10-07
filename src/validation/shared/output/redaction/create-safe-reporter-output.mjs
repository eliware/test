import { collectRedactionSecrets } from "./collect-redaction-secrets.mjs";
import { normalizeRepositoryRelativePath } from "../../repository/normalize-repository-relative-path.mjs";
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
    let printableMessage;
    try {
      printableMessage = String(message);
    } catch {
      printableMessage = "[unprintable diagnostic]";
    }
    const safeMessage = redactProcessOutput(printableMessage, secrets)
      .replace(/[\r\n]+/gu, " ")
      .slice(0, maxLineLength);
    const line = `[${prefix}] ${safeMessage}\n`;
    if (line.length > remaining) {
      outputLength = maxOutputLength;
      return;
    }
    write(line);
    outputLength += line.length;
  };
}
