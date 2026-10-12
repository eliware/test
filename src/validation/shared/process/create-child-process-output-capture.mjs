import { collectRedactionSecrets } from "../output/redaction/collect-redaction-secrets.mjs";
import { createRedactedTextStream } from "../output/redaction/create-redacted-text-stream.mjs";
import {
  createOutputByteBudget,
  truncateOutputTextToBytes,
} from "../output/redaction/create-output-byte-budget.mjs";
import { createSecretTextMatcher } from "../output/redaction/create-secret-text-matcher.mjs";
import { truncateRedactedOutput } from "../output/redaction/truncate-redacted-output.mjs";

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
  let redactors;
  const getSecretMatcher = (secrets, matcherOptions) => makeSecretMatcher(secrets, matcherOptions);
  const getRedactors = () => {
    if (!redactors) {
      redactors = {
        stdout: createRedactedTextStream(redactionSecrets, outputLimit, {
          maxPendingLength,
          getSecretMatcher,
        }),
        stderr: createRedactedTextStream(redactionSecrets, outputLimit, {
          maxPendingLength,
          getSecretMatcher,
        }),
      };
    }
    return redactors;
  };
  const budget = createOutputByteBudget(outputLimit);

  return {
    redactDiagnostic(text) {
      const redacted = getRedactors().stdout.redactComplete(String(text));
      const bounded = truncateOutputTextToBytes(redacted, outputLimit);
      return truncateRedactedOutput(redacted, bounded.text.length);
    },
    push(stream, chunk) {
      if ((stream !== "stdout" && stream !== "stderr") || budget.isFull()) return;
      const raw = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
      if (raw.length === 0) return;
      budget.append(stream, getRedactors()[stream].push(raw));
    },
    finish() {
      if (redactors) {
        budget.append("stdout", redactors.stdout.finish());
        budget.append("stderr", redactors.stderr.finish());
      }
      return budget.output;
    },
  };
}
