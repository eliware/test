import { runJest, runOxlint, runProcess } from '../src/process.mjs';
import { access } from 'node:fs/promises';

describe('process helpers', () => {
  test('captures a successful child process', async () => {
    await expect(runProcess(process.execPath, ['-e', 'process.stdout.write("ok")'], { cwd: process.cwd(), env: process.env })).resolves.toEqual({ code: 0, output: 'ok' });
  });

  test('captures a failed child process', async () => {
    await expect(runProcess(process.execPath, ['-e', 'process.exitCode=4'], { cwd: process.cwd(), env: process.env })).resolves.toMatchObject({ code: 4 });
  });

  test('normalizes process errors', async () => {
    await expect(runProcess('missing-eliware-command', [], { cwd: process.cwd(), env: process.env })).resolves.toMatchObject({ code: 1, output: expect.stringContaining('missing-eliware-command') });
  });

  test('bounds large child-process output while preserving both ends', async () => {
    const result = await runProcess(process.execPath, ['-e', 'process.stdout.write("A".repeat(20000))'], { cwd: process.cwd(), env: process.env });
    expect(result.output.length).toBeLessThanOrEqual(16 * 1024);
    expect(result.output).toContain('[Output truncated:');
    expect(result.output.startsWith('A'.repeat(100))).toBe(true);
    expect(result.output.endsWith('A'.repeat(100))).toBe(true);
  });

  test('uses the documented JavaScript string-length bound for multibyte output', async () => {
    const result = await runProcess(process.execPath, ['-e', 'process.stdout.write("🙂".repeat(10000))'], { cwd: process.cwd(), env: process.env });
    expect(result.output).toContain('[Output truncated:');
    expect(result.output.length).toBeLessThanOrEqual(16 * 1024);
  });

  test('flushes terminal multibyte diagnostics explicitly', async () => {
    const result = await runProcess(process.execPath, ['-e', 'process.stderr.write("終端🙂")'], { cwd: process.cwd(), env: process.env });
    expect(result.output).toContain('終端🙂');
  });

  test('keeps the truncation marker inside the exact output budget', async () => {
    const result = await runProcess(process.execPath, ['-e', 'process.stdout.write("B".repeat(16385))'], { cwd: process.cwd(), env: process.env });
    expect(result.output.length).toBe(16 * 1024);
  });

  test('provides bundled Jest and Oxlint wrappers', async () => {
    expect(await runJest(['--version'], { cwd: process.cwd(), env: process.env })).toMatchObject({ code: 0 });
    expect(await runOxlint(['--version'], { cwd: process.cwd(), env: process.env })).toMatchObject({ code: 0 });
  });

  test('forwards arguments through the Windows npm cmd shim', async () => {
    if (process.platform !== 'win32') return;
    try { await access('node_modules/.bin/eliware-test.cmd'); } catch { return; }
    const result = await runProcess(process.env.ComSpec, ['/d', '/c', 'node_modules\\.bin\\eliware-test.cmd --lint tests/example.test.mjs'], { cwd: process.cwd(), env: process.env });
    expect(result.code).toBe(1);
    expect(result.output).toContain('cannot be combined');
  });
});
