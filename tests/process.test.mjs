import { runJest, runOxlint, runProcess } from '../src/process.mjs';

describe('process helpers', () => {
  test('captures a successful child process', async () => {
    await expect(runProcess(process.execPath, ['-e', 'process.stdout.write("ok")'], { cwd: process.cwd(), env: process.env })).resolves.toEqual({ code: 0, output: 'ok' });
  });

  test('captures a failed child process', async () => {
    await expect(runProcess(process.execPath, ['-e', 'process.exitCode=4'], { cwd: process.cwd(), env: process.env })).resolves.toMatchObject({ code: 4 });
  });

  test('normalizes process errors', async () => {
    await expect(runProcess('missing-eliware-command', [], { cwd: process.cwd(), env: process.env })).resolves.toMatchObject({ code: 1 });
  });

  test('bounds large child-process output while preserving both ends', async () => {
    const result = await runProcess(process.execPath, ['-e', 'process.stdout.write("A".repeat(20000))'], { cwd: process.cwd(), env: process.env });
    expect(result.output.length).toBeLessThan(17000);
    expect(result.output).toContain('[Output truncated:');
    expect(result.output.startsWith('A'.repeat(100))).toBe(true);
    expect(result.output.endsWith('A'.repeat(100))).toBe(true);
  });

  test('provides bundled Jest and Oxlint wrappers', async () => {
    expect(await runJest(['--version'], { cwd: process.cwd(), env: process.env })).toMatchObject({ code: 0 });
    expect(await runOxlint(['--version'], { cwd: process.cwd(), env: process.env })).toMatchObject({ code: 0 });
  });
});
