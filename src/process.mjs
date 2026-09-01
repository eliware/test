import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const MAX_OUTPUT = 16 * 1024;
const OUTPUT_HEAD = 4 * 1024;

function resolveFromConsumer(cwd, specifier) {
  return createRequire(resolve(cwd, 'package.json')).resolve(specifier);
}

export function runProcess(command, argumentsList, options) {
  return new Promise((resolveResult) => {
    let output = '';
    let settled = false;
    // Intentional: the caller supplies the trusted consumer environment so npm and tool config resolve normally.
    const child = spawn(command, argumentsList, { cwd: options.cwd, env: options.env, windowsHide: true });
    const settle = (result) => {
      if (!settled) {
        settled = true;
        resolveResult(result);
      }
    };
    const capture = (chunk) => { output = boundOutput(output + chunk.toString()); };
    child.stdout.on('data', capture);
    child.stderr.on('data', capture);
    child.on('error', (error) => settle({ code: 1, output: `${error.message}\n` }));
    /* istanbul ignore next -- a normal child process always provides an exit code. */
    child.on('close', (code) => settle({ code: code ?? 1, output: boundOutput(output) }));
  });
}

function boundOutput(output) {
  if (output.length <= MAX_OUTPUT) return output;
  const tailLength = MAX_OUTPUT - OUTPUT_HEAD;
  const omitted = output.length - MAX_OUTPUT;
  return `${output.slice(0, OUTPUT_HEAD)}\n[Output truncated: ${omitted} characters omitted.]\n${output.slice(-tailLength)}`;
}

export function runJest(argumentsList, options) {
  const jestPackage = resolveFromConsumer(options.cwd, 'jest/package.json');
  const jestPath = resolve(dirname(jestPackage), 'bin/jest.js');
  return runProcess(process.execPath, ['--experimental-vm-modules', '--no-warnings', jestPath, ...argumentsList], options);
}

export function runOxlint(argumentsList, options) {
  const oxlintPackage = resolveFromConsumer(options.cwd, 'oxlint/package.json');
  return runProcess(process.execPath, [resolve(dirname(oxlintPackage), 'bin/oxlint'), ...argumentsList], options);
}
