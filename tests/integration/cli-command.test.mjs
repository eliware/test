import { spawn } from 'node:child_process';
import { rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import packageMetadata from '../../package.json' with { type: 'json' };

function runCli(...argumentsList) {
  const cwd = argumentsList[0]?.cwd ?? resolve('test-fixtures/cli-success');
  const cliArguments = argumentsList[0]?.cwd ? argumentsList.slice(1) : argumentsList;
  return new Promise((resolveResult) => {
    const child = spawn(process.execPath, [resolve('test2/bin/eliware-test.mjs'), ...cliArguments], { cwd });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => resolveResult({ code: 1, stdout, stderr: `${stderr}${error.message}\n` }));
    child.on('close', (code) => resolveResult({ code, stdout, stderr }));
  });
}

test('prints version without running validation', async () => {
  await expect(runCli('--version')).resolves.toMatchObject({ code: 0, stdout: `${packageMetadata.version}\n`, stderr: '' });
});

test('prints help without running validation', async () => {
  await expect(runCli('--help')).resolves.toMatchObject({ code: 0, stdout: expect.stringContaining('eliware-test --lint'), stderr: '' });
});

test('rejects invalid wrapper arguments through the top-level error path', async () => {
  await expect(runCli('--coverage')).resolves.toMatchObject({ code: 4, stderr: expect.stringContaining('managed by eliware-test') });
});

test('preserves focused-path failures with the explicit coverage opt-out', async () => {
  await expect(runCli('--ignore-100x4', 'tests/does-not-exist-cli.test.mjs'))
    .resolves.toMatchObject({ code: 6, stdout: expect.stringContaining('Focused test path not found') });
});

test('dispatches a successful default command in a dedicated fixture workspace', async () => {
  await expect(runCli({ cwd: resolve('test-fixtures/cli-success') }, 'tests/passing.test.mjs'))
    .resolves.toMatchObject({ code: 0, stdout: expect.stringContaining('Tests passed') });
}, 15000);

test('propagates an actual Jest failure through the executable', async () => {
  const result = await runCli({ cwd: resolve('test-fixtures/cli-success') }, 'tests/failing.test.mjs');
  expect(result.code).not.toBe(0);
  expect(result.stdout).toContain('Tests failed');
  expect(result.stdout).toContain('Expected: "success"');
}, 15000);

test('dispatches lint-only validation', async () => {
  await expect(runCli('--lint')).resolves.toMatchObject({ code: 0, stdout: expect.stringContaining('Lint passed') });
}, 15000);

test('propagates a real lint failure through the executable', async () => {
  const cwd = resolve('test-fixtures/cli-success');
  const file = resolve(cwd, 'src/cli-lint-failure.mjs');
  await writeFile(file, 'const unused = 1;\n');
  try {
    const result = await runCli({ cwd }, '--lint');
    expect(result.code).not.toBe(0);
    expect(result.stdout).toContain('Lint failed');
  } finally {
    await rm(file, { force: true });
  }
}, 15000);

test('dispatches the explicit coverage opt-out', async () => {
  await expect(runCli('--ignore-100x4', 'tests/passing.test.mjs'))
    .resolves.toMatchObject({ code: 0, stdout: expect.stringContaining('Coverage: ignored') });
}, 15000);

test('accepts the CLI in-band opt-out', async () => {
  await expect(runCli({ cwd: resolve('test-fixtures/cli-success') }, '--no-runInBand', 'tests/passing.test.mjs'))
    .resolves.toMatchObject({ code: 0, stdout: expect.stringContaining('Tests passed') });
}, 15000);
