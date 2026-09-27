import { appendBoundedOutputTail } from "./append-bounded-output-tail.mjs";

export function createOutdatedDependenciesOutput(stdoutLimit, stderrLimit) {
  let stdout = "";
  let stderr = "";

  return {
    appendStdout(chunk) {
      const text = chunk.toString();
      if (stdout.length + text.length > stdoutLimit) return false;
      stdout += text;
      return true;
    },
    appendStderr(chunk) {
      stderr = appendBoundedOutputTail(stderr, chunk, stderrLimit);
    },
    get stdout() {
      return stdout;
    },
    get stderr() {
      return stderr;
    },
  };
}
