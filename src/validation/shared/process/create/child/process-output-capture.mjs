import { collectRedactionSecrets } from "../../../output/redaction/collect-redaction-secrets.mjs";
import { createOutputByteBudget } from "../../../output/redaction/create/output-byte-budget.mjs";
import { createSecretTextMatcher } from "../../../output/redaction/create/secret-text-matcher.mjs";
import { redactChildProcessDiagnostic } from "./redact-diagnostic.mjs";
import { createLazyChildProcessRedactors } from "./process-output-capture/redactors.mjs";

export function createChildProcessOutputCapture(
  options,
  suppliedSecrets,
  outputLimit,
  makeSecretMatcher = createSecretTextMatcher,
) {
  const redactionSecrets = [
    ...collectRedactionSecrets(options.env ?? process.env),
    ...(Array.isArray(suppliedSecrets) ? suppliedSecrets : []),
  ];
  const maxPendingLength = Math.max(1, Math.floor(outputLimit / 2));
  const redactors = createLazyChildProcessRedactors(
    redactionSecrets,
    outputLimit,
    maxPendingLength,
    makeSecretMatcher,
  );
  const budget = createOutputByteBudget(outputLimit);

  return {
    redactDiagnostic(text) {
      return redactChildProcessDiagnostic(text, redactors.get().stdout, outputLimit);
    },
    push(stream, chunk) {
      if ((stream !== "stdout" && stream !== "stderr") || budget.isFull()) return;
      const raw = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
      if (raw.length === 0) return;
      budget.append(stream, redactors.get()[stream].push(raw));
    },
    finish() {
      if (redactors.isInitialized()) {
        const streams = redactors.get();
        budget.append("stdout", streams.stdout.finish());
        budget.append("stderr", streams.stderr.finish());
      }
      return budget.output;
    },
  };
}
