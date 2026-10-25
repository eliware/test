import { collectRedactionSecrets } from "../output/redaction/collect-redaction-secrets.mjs";
import { createRedactedTextStream } from "../output/redaction/create/redacted/text/stream.mjs";
import { createChildOutputStream } from "./create-child/output-stream.mjs";
import { createChildOutputCaptureBuffer } from "./create-child/capture.mjs";

export function createChildOutputCapture(
  options,
  {
    onStdout,
    onStderr,
    onRawStdout,
    onRawStderr,
    captureStderr,
    env,
    createTextStream = createRedactedTextStream,
  } = {},
) {
  const outputLimit = options;
  const redactionSecrets = collectRedactionSecrets(env);
  const maxPendingLength = Math.max(1, Math.floor(outputLimit / 2));
  const stdoutRedactor = createTextStream(redactionSecrets, outputLimit + 1, {
    maxPendingLength,
  });
  const stderrRedactor = createTextStream(redactionSecrets, outputLimit + 1, {
    maxPendingLength,
  });
  const capture = createChildOutputCaptureBuffer(outputLimit);
  const stream = createChildOutputStream({ onStdout, onStderr }, outputLimit);
  const appendStdout = (text) => {
    stream.stdout(text);
    capture.appendStdout(text);
  };
  const appendStderr = (text) => {
    stream.stderr(text);
    capture.appendStderr(captureStderr?.(text) ?? text);
  };

  return {
    stdout(text) {
      onRawStdout?.(text);
      appendStdout(stdoutRedactor.push(text));
    },
    stderr(text) {
      onRawStderr?.(text);
      const redacted = stderrRedactor.push(text);
      appendStderr(redacted);
      return redacted;
    },
    redactComplete(text) {
      return stderrRedactor.redactComplete(text);
    },
    flush() {
      appendStdout(stdoutRedactor.finish());
      const stderr = stderrRedactor.finish();
      appendStderr(stderr);
      return { stdout: "", stderr };
    },
    result() {
      return capture.result();
    },
  };
}
