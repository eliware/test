import { appendBounded, boundOutput } from './truncate-output.mjs';

/** Capture both child-process streams while enforcing the output bound. */
export function createOutputCapture() {
  let output = '';
  const stdoutDecoder = new TextDecoder();
  const stderrDecoder = new TextDecoder();

  const capture = (stream) => (chunk) => {
    const decoder = stream === 'stderr' ? stderrDecoder : stdoutDecoder;
    output = appendBounded(output, typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true }));
  };

  const finish = (errorMessage = '') => {
    output = appendBounded(output, stdoutDecoder.decode());
    output = appendBounded(output, stderrDecoder.decode());
    return boundOutput(`${output}${errorMessage}`);
  };

  return { capture, finish };
}
