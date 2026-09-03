import { spawn } from 'node:child_process';
import { appendBounded, boundOutput } from './output/truncate.mjs';
import { buildChildOptions } from './environment/build-child.mjs';

export function runProcess(command, argumentsList, options) {
  return new Promise((resolveResult) => {
    let output = '';
    let settled = false;
    let processError = '';
    const stdoutDecoder = new TextDecoder();
    const stderrDecoder = new TextDecoder();
    const child = (options.spawn ?? spawn)(command, argumentsList, buildChildOptions(options));
    const finish = (code, errorMessage) => {
      if (settled) return;
      output = appendBounded(output, stdoutDecoder.decode(undefined, { stream: false }));
      output = appendBounded(output, stderrDecoder.decode(undefined, { stream: false }));
      settled = true;
      resolveResult({ code, output: boundOutput(`${output}${errorMessage}`) });
    };
    const capture = (decoder) => (chunk) => { if (!settled) output = appendBounded(output, decoder.decode(chunk, { stream: true })); };
    child.stdout.on('data', capture(stdoutDecoder));
    child.stderr.on('data', capture(stderrDecoder));
    child.on('error', (error) => { processError = `${error.message}\n`; finish(1, processError); });
    child.on('close', (code) => finish(processError ? 1 : (Number.isInteger(code) && code >= 0 ? code : 1), processError));
  });
}
