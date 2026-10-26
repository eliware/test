import { createJestOutputCapture } from "./capture-streams.mjs";
import { createJestOutputPersistence } from "./persist-output.mjs";
import { redactJestOutput } from "./redact-output.mjs";

const logLimit = 1_000_000;
const truncationMarker = "\n[eliware-test: Jest output was truncated at the configured limit.]\n";

export function createJestConsoleOutputLog(path, { append, replace, maxLength = logLimit } = {}) {
  const persistence = createJestOutputPersistence(path, { append, replace });
  const capture = createJestOutputCapture({ maxLength });
  let writeError;

  return {
    start() {
      writeError = !persistence.start();
    },
    append(stream, chunk) {
      if (!path || writeError) return;
      const value = capture.append(stream, chunk);
      if (value && !persistence.append(value)) writeError = true;
    },
    finish(secrets = []) {
      const { output, captured, truncated } = capture.snapshot();
      const result = redactJestOutput(output, captured, secrets);
      if (!persistence.finish(`${result.safeCaptured}${truncated ? truncationMarker : ""}`))
        writeError = true;
      return {
        redacted: result.redacted,
        redactionKinds: result.redactionKinds,
        writeError: Boolean(writeError),
      };
    },
  };
}
