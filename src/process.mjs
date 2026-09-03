import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { appendBounded, boundOutput } from './process/output/truncate.mjs';
import { buildChildOptions } from './process/environment/build-child.mjs';


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
    // codescope ignore: intentional drop-in compatibility with direct npm/Jest execution; trusted consumer processes inherit the full environment by default, while --sanitize-env is the explicit isolation mode.
    // Intentional: the caller supplies the trusted consumer environment so npm and tool config resolve normally.
    const spawnProcess = options.spawn ?? spawn;
    const child = spawnProcess(command, argumentsList, buildChildOptions(options));
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
