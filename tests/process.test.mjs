import { runJest, runNpm, runOxlint, runProcess } from '../src/process.mjs';
import { access } from 'node:fs/promises';
import { EventEmitter } from 'node:events';

describe('process helpers', () => {
  test('captures a successful child process', async () => {
    await expect(runProcess(process.execPath, ['-e', 'process.stdout.write("ok")'], { cwd: process.cwd(), env: process.env })).resolves.toEqual({ code: 0, output: 'ok' });
  });

  test('supports an explicitly sanitized environment', async () => {
    const result = await runProcess(process.execPath, ['-e', 'process.stdout.write(process.env.ELIWARE_TEST_SECRET ?? "missing")'], { cwd: process.cwd(), inheritEnv: false, env: { ELIWARE_TEST_SECRET: 'safe' } });
    expect(result).toMatchObject({ code: 0, output: 'safe' });
  });

  test('handles child error and late stream events safely', async () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    const resultPromise = runProcess('ignored', [], { cwd: process.cwd(), spawn: () => child });
    child.emit('error', new Error('spawn failed'));
    child.stdout.emit('data', Buffer.from('late'));
    child.stderr.emit('data', Buffer.from('late error'));
    child.emit('close', null);
    await expect(resultPromise).resolves.toMatchObject({ code: 1, output: expect.stringContaining('spawn failed') });
  });

  test('normalizes a signal-terminated child close', async () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    const resultPromise = runProcess('ignored', [], { cwd: process.cwd(), spawn: () => child });
    child.emit('close', null);
    await expect(resultPromise).resolves.toMatchObject({ code: 1 });
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

  test('provides an npm wrapper', async () => {
    const original = process.env.ComSpec;
    try {
      delete process.env.ComSpec;
      const child = new EventEmitter();
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      const result = runNpm(['--version'], { cwd: process.cwd(), env: process.env, spawn: () => child });
      child.emit('close', 0);
      await expect(result).resolves.toMatchObject({ code: 0 });
      process.env.ComSpec = 'cmd.exe';
      const windowsChild = new EventEmitter();
      windowsChild.stdout = new EventEmitter();
      windowsChild.stderr = new EventEmitter();
      const windowsResult = runNpm(['--version'], { cwd: process.cwd(), env: process.env, spawn: (command, args) => {
        expect(command).toBe('cmd.exe');
        expect(args).toEqual(['/d', '/s', '/c', 'npm', '--version']);
        return windowsChild;
      } });
      windowsChild.emit('close', 0);
      await expect(windowsResult).resolves.toMatchObject({ code: 0 });
    } finally {
      process.env.ComSpec = original;
    }
  });

  test('forwards arguments through the Windows npm cmd shim', async () => {
    if (process.platform !== 'win32') return;
    try { await access('node_modules/.bin/eliware-test.cmd'); } catch { return; }
    const result = await runProcess(process.env.ComSpec, ['/d', '/c', 'node_modules\\.bin\\eliware-test.cmd --lint tests/example.test.mjs'], { cwd: process.cwd(), env: process.env });
    expect(result.code).toBe(1);
    expect(result.output).toContain('cannot be combined');
  });
});
