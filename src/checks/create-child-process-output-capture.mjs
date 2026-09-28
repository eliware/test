import { collectRedactionSecrets } from "./collect-redaction-secrets.mjs";
import { createRedactedTextStream } from "./create-redacted-text-stream.mjs";
import { createOutputByteBudget } from "./create-output-byte-budget.mjs";

export function createChildProcessOutputCapture(options, suppliedSecrets, outputLimit) {
  const redactionSecrets = [
    ...collectRedactionSecrets(options.env ?? process.env),
    ...(Array.isArray(suppliedSecrets) ? suppliedSecrets : []),
  ];
  const redactors = {
    stdout: createRedactedTextStream(redactionSecrets, outputLimit),
    stderr: createRedactedTextStream(redactionSecrets, outputLimit),
  };
  const budget = createOutputByteBudget(outputLimit);

  return {
    redactDiagnostic(text) {
      const redacted = redactors.stdout.redactComplete(String(text));
      return budget.truncate(redacted);
    },
    push(stream, chunk) {
      if (!redactors[stream] || budget.isFull()) return;
      const raw = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
      budget.append(stream, redactors[stream].push(raw));
    },
    finish() {
      budget.append("stdout", redactors.stdout.finish());
      budget.append("stderr", redactors.stderr.finish());
      return budget.output;
    },
  };
}
