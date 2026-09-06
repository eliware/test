import { appendBounded, boundOutput } from './truncate-output.mjs';

/** Capture both child-process streams while enforcing the output bound. */
export function createOutputCapture() {
  let output = '';
  let finalized;
  const stdoutDecoder = new TextDecoder();
  const stderrDecoder = new TextDecoder();

  const capture = (stream) => (chunk) => {
    const decoder = stream === 'stderr' ? stderrDecoder : stdoutDecoder;
    if (typeof chunk === 'string') output = appendBounded(output, chunk);
    else output = appendBounded(output, decoder.decode(chunk, { stream: true }));
  };

  const finish = (errorMessage = '') => {
    if (finalized !== undefined) return finalized;
    output = appendBounded(output, stdoutDecoder.decode());
    output = appendBounded(output, stderrDecoder.decode());
    finalized = boundOutput(`${output}${errorMessage}`);
    return finalized;
  };

  return { capture, finish };
}
