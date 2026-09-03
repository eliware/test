import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const MAX_OUTPUT = 16 * 1024;
const OUTPUT_HEAD = 4 * 1024;
const TRUNCATION_PREFIX = '\n[Output truncated: ';
const TRUNCATION_SUFFIX = ' characters omitted.]\n';

function resolveFromConsumer(cwd, specifier) {
  return createRequire(resolve(cwd, 'package.json')).resolve(specifier);
}

export function runProcess(command, argumentsList, options) {
  // Callers may set inheritEnv: false to use an explicitly supplied sanitized environment.
  return new Promise((resolveResult) => {
    let output = '';
    let settled = false;
    let processError = '';
    const stdoutDecoder = new TextDecoder();
    const stderrDecoder = new TextDecoder();
    // Intentional: the caller supplies the trusted consumer environment so npm and tool config resolve normally.
    const inheritedEnvironment = options.inheritEnv === false ? {} : process.env;
    const spawnProcess = options.spawn ?? spawn;
    const child = spawnProcess(command, argumentsList, { cwd: options.cwd, env: { ...inheritedEnvironment, ...options.env }, windowsHide: true });
    const settle = (result) => {
      settled = true;
      resolveResult(result);
    };
    const finish = (code, errorMessage) => {
      if (settled) return;
      output = appendBounded(output, stdoutDecoder.decode(undefined, { stream: false }));
      output = appendBounded(output, stderrDecoder.decode(undefined, { stream: false }));
      settle({ code, output: boundOutput(`${output}${errorMessage}`) });
    };
    const capture = (decoder) => (chunk) => {
      if (!settled) output = appendBounded(output, decoder.decode(chunk, { stream: true }));
    };
    child.stdout.on('data', capture(stdoutDecoder));
    child.stderr.on('data', capture(stderrDecoder));
    child.on('error', (error) => {
      processError = `${error.message}\n`;
      finish(1, processError);
    });
    child.on('close', (code) => {
      finish(processError ? 1 : (Number.isInteger(code) && code >= 0 ? code : 1), processError);
    });
  });
}

function appendBounded(output, chunk) {
  if (chunk.length > MAX_OUTPUT) return boundOutput(chunk);
  return boundOutput(output + chunk);
}

function boundOutput(output) {
  if (output.length <= MAX_OUTPUT) return output;
  const omitted = output.length - MAX_OUTPUT;
  const marker = `${TRUNCATION_PREFIX}${omitted}${TRUNCATION_SUFFIX}`;
  const contentBudget = Math.max(0, MAX_OUTPUT - marker.length);
  const headLength = Math.min(OUTPUT_HEAD, contentBudget);
  const tailLength = contentBudget - headLength;
  return `${output.slice(0, headLength)}${marker}${output.slice(-tailLength)}`;
}

export function runJest(argumentsList, options) {
  const jestPackage = resolveFromConsumer(options.cwd, 'jest/package.json');
  const jestPath = resolve(dirname(jestPackage), 'bin/jest.js');
  const jestArguments = options.runInBand === false || argumentsList.includes('--runInBand') ? argumentsList : ['--runInBand', ...argumentsList];
  return runProcess(process.execPath, ['--experimental-vm-modules', '--no-warnings', jestPath, ...jestArguments], options);
}

export function runOxlint(argumentsList, options) {
  const oxlintPackage = resolveFromConsumer(options.cwd, 'oxlint/package.json');
  return runProcess(process.execPath, [resolve(dirname(oxlintPackage), 'bin/oxlint'), ...argumentsList], options);
}

export function runNpm(argumentsList, options) {
  const [command, args] = npmInvocation(argumentsList);
  return runProcess(command, args, { ...options, env: { ...options.env, npm_config_allow_scripts: undefined } });
}

export function npmInvocation(argumentsList) {
  const npmCli = resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  return [process.execPath, [npmCli, ...argumentsList]];
}
