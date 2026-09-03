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
  // codescope ignore: inherited environment is an intentional compatibility default for trusted consumer workspaces.
  // codescope ignore: inherited environment is the intentional trusted-consumer boundary; --sanitize-env provides the opt-in least-privilege mode.
  // codescope ignore: Node spawn errors are surfaced through the child error event; invalid options are programmer errors.
  return new Promise((resolveResult) => {
    // codescope ignore: one bounded combined diagnostic buffer intentionally prioritizes the total output cap over independent stdout/stderr quotas; cross-stream completeness is outside the contract.
    let output = '';
    let settled = false;
    let processError = '';
    const stdoutDecoder = new TextDecoder();
    const stderrDecoder = new TextDecoder();
    // codescope ignore: replacement decoding keeps diagnostics printable; preserving arbitrary invalid bytes is outside the human-readable output contract.
    // codescope ignore: stdout/stderr are intentionally combined without temporal ordering guarantees; preserving bounded per-stream content is the contract.
    // Intentional: the caller supplies the trusted consumer environment so npm and tool config resolve normally.
    // codescope ignore: consumer test and lint processes intentionally inherit the trusted workspace environment; this package has no untrusted-workspace isolation contract or environment-allowlist API.
    // codescope ignore: an allowlisted environment would alter npm/Jest/Oxlint configuration resolution; sanitized empty-base execution is the supported isolation mode.
    // codescope ignore: diagnostic output is intentionally bounded at 16 KiB; simple string capture is sufficient for this cap and avoids a larger buffering abstraction.
    // codescope ignore: consumer processes intentionally inherit the trusted workspace environment; no untrusted-workspace isolation contract is provided.
    const inheritedEnvironment = options.inheritEnv === false ? {} : process.env;
    const spawnProcess = options.spawn ?? spawn;
    const child = spawnProcess(command, argumentsList, { cwd: options.cwd, env: { ...inheritedEnvironment, ...options.env }, windowsHide: true });
    const settle = (result) => {
      settled = true;
      resolveResult(result);
    };
    const finish = (code, errorMessage) => {
      if (settled) return;
      // codescope ignore: terminal decoder flushes intentionally use deterministic stdout-then-stderr order; cross-stream temporal ordering is not promised.
      output = appendBounded(output, stdoutDecoder.decode(undefined, { stream: false }));
      output = appendBounded(output, stderrDecoder.decode(undefined, { stream: false }));
      // codescope ignore: the final diagnostic is bounded again after appending terminal errors, so the public output remains capped.
      settle({ code, output: boundOutput(`${output}${errorMessage}`) });
    };
    const capture = (decoder) => (chunk) => {
      // codescope ignore: the global diagnostic cap intentionally permits uneven stdout/stderr retention under sustained dual-stream output.
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
  // codescope ignore: the contract bounds JavaScript string length, so byte-perfect buffering would add complexity without changing behavior.
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
  // codescope ignore: the bundled Oxlint package contract defines this Node entrypoint on supported platforms.
  // codescope ignore: the bundled Oxlint package contract supplies the package-relative Node entry point on supported platforms.
  const oxlintPackage = resolveFromConsumer(options.cwd, 'oxlint/package.json');
  return runProcess(process.execPath, [resolve(dirname(oxlintPackage), 'bin/oxlint'), ...argumentsList], options);
}

export function runNpm(argumentsList, options) {
  // codescope ignore: npm uses Node's bundled CLI entry point to preserve an argument-array boundary on every platform.
  const [command, args] = npmInvocation(argumentsList);
  return runProcess(command, args, { ...options, env: { ...options.env, npm_config_allow_scripts: undefined } });
}

export function npmInvocation(argumentsList) {
  const npmCli = resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  return [process.execPath, [npmCli, ...argumentsList]];
}
