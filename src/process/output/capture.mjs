import { appendBounded, boundOutput } from './truncate.mjs';

export function createOutputCapture() {
  let output = '';
  const stdoutDecoder = new TextDecoder();
  const stderrDecoder = new TextDecoder();
  const capture = (decoder) => (chunk) => { output = appendBounded(output, decoder.decode(chunk, { stream: true })); };
  const finish = (errorMessage = '') => boundOutput(`${appendBounded(output, stdoutDecoder.decode(undefined, { stream: false }))}${stderrDecoder.decode(undefined, { stream: false })}${errorMessage}`);
  return { capture, finish };
}
