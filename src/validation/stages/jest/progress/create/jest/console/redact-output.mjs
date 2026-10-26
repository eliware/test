import { redactProcessOutput } from "../../../../../../shared/output/redaction/redact/process-output.mjs";
import { findJestOutputRedactionKinds } from "./redaction-kinds.mjs";

export function redactJestOutput(output, captured, secrets) {
  const safeStreams = Object.fromEntries(
    Object.entries(output).map(([stream, chunks]) => {
      const source = chunks.join("");
      return [stream, redactProcessOutput(source, secrets)];
    }),
  );
  const safeCaptured = redactProcessOutput(captured, secrets);
  const redacted =
    captured !== safeCaptured ||
    Object.entries(output).some(([stream, chunks]) => chunks.join("") !== safeStreams[stream]);
  return {
    captured,
    safeCaptured,
    redacted,
    redactionKinds: findJestOutputRedactionKinds({ stdout: [captured] }, secrets),
  };
}
