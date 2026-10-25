import { redactProcessOutput } from "../../../../../../shared/output/redaction/redact/process-output.mjs";
import { findJestOutputRedactionKinds } from "./redaction-kinds.mjs";
import { createJestOutputPersistence } from "./persist-output.mjs";

const logLimit = 1_000_000;
const truncationMarker = "\n[eliware-test: Jest output was truncated at the configured limit.]\n";

export function createJestConsoleOutputLog(path, { append, replace, maxLength = logLimit } = {}) {
  const persistence = createJestOutputPersistence(path, { append, replace });
  const output = { stdout: [], stderr: [] };
  const chunks = [];
  let length = 0;
  let truncated = false;
  let writeError;

  return {
    start() {
      writeError = !persistence.start();
    },
    append(stream, chunk) {
      if (!path || !Object.hasOwn(output, stream) || writeError || truncated) return;
      const text = String(chunk);
      const remaining = maxLength - length;
      const value = text.slice(0, remaining);
      if (value) {
        output[stream].push(value);
        chunks.push(value);
        length += value.length;
        if (!persistence.append(value)) writeError = true;
      }
      if (value.length < text.length) truncated = true;
    },
    finish(secrets = []) {
      const streams = Object.fromEntries(
        Object.entries(output).map(([stream, chunks]) => {
          const source = chunks.join("");
          return [stream, redactProcessOutput(source, secrets)];
        }),
      );
      const captured = chunks.join("");
      const safeCaptured = redactProcessOutput(captured, secrets);
      const redacted =
        captured !== safeCaptured ||
        Object.entries(output).some(
          ([stream, streamChunks]) => streamChunks.join("") !== streams[stream],
        );
      const redactionKinds = findJestOutputRedactionKinds({ stdout: [captured] }, secrets);
      if (!persistence.finish(`${safeCaptured}${truncated ? truncationMarker : ""}`))
        writeError = true;
      return { redacted, redactionKinds, writeError: Boolean(writeError) };
    },
  };
}
