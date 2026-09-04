import { EventEmitter } from 'node:events';
import { runChildProcess } from '../../src/processes/run-child-process.mjs';

test('exports the process runner', () => {
  expect(runChildProcess).toBeInstanceOf(Function);
});

test('rejects malformed process arguments before spawning', () => {
  expect(() => runChildProcess('', [])).toThrow(TypeError);
  expect(() => runChildProcess(process.execPath, 'not-an-array')).toThrow(TypeError);
  expect(() => runChildProcess(process.execPath, [], null)).toThrow(TypeError);
});

test('uses default arguments and options', async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const resultPromise = runChildProcess('ignored', undefined, { spawn: () => child });
  child.emit('close', 0);
  await expect(resultPromise).resolves.toEqual({ code: 0, output: '' });
});

test('captures a successful child process', async () => {
  await expect(runChildProcess(process.execPath, ['-e', 'process.stdout.write("ok")'], { cwd: process.cwd() }))
    .resolves.toEqual({ code: 0, output: 'ok' });
});

test('handles child errors and late stream events safely', async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const resultPromise = runChildProcess('ignored', [], { spawn: () => child });
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
  const resultPromise = runChildProcess('ignored', [], { spawn: () => child });
  child.emit('close', null);
  await expect(resultPromise).resolves.toMatchObject({ code: 1 });
});

test('bounds large child-process output', async () => {
  const result = await runChildProcess(process.execPath, ['-e', 'process.stdout.write("A".repeat(20000))'], { cwd: process.cwd() });
  expect(result.output.length).toBeLessThanOrEqual(16 * 1024);
  expect(result.output).toContain('[Output truncated:');
});

test('captures non-zero exit codes and terminal multibyte diagnostics', async () => {
  await expect(runChildProcess(process.execPath, ['-e', 'process.exitCode=4'], { cwd: process.cwd() })).resolves.toMatchObject({ code: 4 });
  await expect(runChildProcess(process.execPath, ['-e', 'process.stderr.write("終端🙂")'], { cwd: process.cwd() })).resolves.toMatchObject({ code: 0, output: '終端🙂' });
});

test('normalizes missing commands to a failed result', async () => {
  await expect(runChildProcess('missing-eliware-command', [], { cwd: process.cwd() }))
    .resolves.toMatchObject({ code: 1, output: expect.stringContaining('missing-eliware-command') });
});

test('normalizes synchronous spawn failures', async () => {
  await expect(runChildProcess('ignored', [], { spawn: () => { throw new Error('spawn failed synchronously'); } }))
    .resolves.toEqual({ code: 1, output: 'spawn failed synchronously\n' });
});


test('keeps the truncation marker inside the exact output budget', async () => {
  const result = await runChildProcess(process.execPath, ['-e', 'process.stdout.write("B".repeat(16385))'], { cwd: process.cwd() });
  expect(result.output.length).toBe(16 * 1024);
});

test('bounds multibyte output by JavaScript string length', async () => {
  const result = await runChildProcess(process.execPath, ['-e', 'process.stdout.write("🙂".repeat(10000))'], { cwd: process.cwd() });
  expect(result.output).toContain('[Output truncated:');
  expect(result.output.length).toBeLessThanOrEqual(16 * 1024);
});
