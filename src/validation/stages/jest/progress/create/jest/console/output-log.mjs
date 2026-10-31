import { createJestOutputCapture } from "./capture-streams.mjs";
import { createJestOutputPersistence } from "./persist-output.mjs";
import { redactJestOutput } from "./redact-output.mjs";
import { stripJestProgressLines } from "./strip-progress-lines.mjs";

const logLimit = 1_000_000;
const truncationMarker = "\n[eliware-test: Jest output was truncated at the configured limit.]\n";

export function createJestConsoleOutputLog(path, { append, replace, maxLength = logLimit } = {}) {
  const persistence = createJestOutputPersistence(path, { append, replace });
  const capture = createJestOutputCapture({ maxLength });
  let writeError;
  let finished = false;

  return {
    start() {
      finished = false;
      writeError = !persistence.start();
    },
    append(stream, chunk) {
      if (!path || writeError || finished) return;
      const value = capture.append(stream, chunk);
      const naturalOutput = stripJestProgressLines(value);
      if (naturalOutput && !persistence.append(naturalOutput)) writeError = true;
    },
    finish(secrets = []) {
      finished = true;
      const { output, captured, truncated } = capture.snapshot();
      const result = redactJestOutput(output, captured, secrets);
      const naturalOutput = stripJestProgressLines(result.safeCaptured);
      if (!persistence.finish(`${naturalOutput}${truncated ? truncationMarker : ""}`))
        writeError = true;
      return {
        redacted: result.redacted,
        redactionKinds: result.redactionKinds,
        writeError: Boolean(writeError),
      };
    },
  };
}
