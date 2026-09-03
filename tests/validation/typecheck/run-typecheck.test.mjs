import { runTypecheck } from '../../../src/validation/typecheck/run-typecheck.mjs';

const context = (overrides = {}) => ({ cwd: 'C:/repo', sanitizeEnv: false, write: () => {}, ...overrides });

test('runs configured typecheck successfully', async () => {
  const calls = [];
  await expect(runTypecheck(context({ runTypecheck: async (...args) => { calls.push(args); return { code: 0, output: '' }; } }), 'typecheck')).resolves.toBe(0);
  expect(calls[0][0]).toEqual(['run', 'typecheck']);
});

test('normalizes an empty result as failure', async () => {
  await expect(runTypecheck(context({ runTypecheck: async () => undefined }), 'typecheck')).resolves.toBe(19);
});

test('passes sanitized environment mode to typecheck', async () => {
  let options;
  await runTypecheck(context({ sanitizeEnv: true, runTypecheck: async (...args) => { options = args[1]; return { code: 0, output: '' }; } }), 'typecheck');
  expect(options.inheritEnv).toBe(false);
});

test('fails clearly when typecheck fails or cannot start', async () => {
  const messages = [];
  await expect(runTypecheck(context({ runTypecheck: async () => ({ code: 1, output: 'bad' }), write: (message) => messages.push(message) }), 'typecheck')).resolves.toBe(19);
  await expect(runTypecheck(context({ runTypecheck: async () => { throw new Error('missing'); }, write: (message) => messages.push(message) }), 'typecheck')).resolves.toBe(19);
  expect(messages.join('')).toContain('Typecheck');
});
