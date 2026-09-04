import { debugOutput } from '../../src/diagnostics/debug-output.mjs';

test('writes structured debug output only when enabled', () => {
  const messages = [];
  debugOutput((message) => messages.push(message), 'Args', ['--watch'], true);
  expect(messages).toEqual(['[Args] ["--watch"]\n']);
  debugOutput((message) => messages.push(message), 'Hidden', 'x', false);
  expect(messages).toHaveLength(1);
});

test('handles missing writers, labels, and circular values safely', () => {
  const messages = [];
  const circular = {};
  circular.self = circular;

  debugOutput(null, 'Ignored', 'value', true);
  debugOutput((message) => messages.push(message), '', circular, true);
  debugOutput((message) => messages.push(message), 'Text', 'plain', true);
  debugOutput(() => {}, 'Default', 'ignored');

  expect(messages).toEqual(['[debug] {"self":"[Circular]"}\n', '[Text] plain\n']);
});

test('redacts sensitive structured debug fields', () => {
  const messages = [];
  debugOutput((message) => messages.push(message), 'Config', {
    token: 'secret-token',
    nested: { password: 'secret-password' },
    safe: 'visible',
  }, true);
  expect(messages[0]).toContain('"token":"[REDACTED]"');
  expect(messages[0]).toContain('"password":"[REDACTED]"');
  expect(messages[0]).toContain('"safe":"visible"');
  expect(messages[0]).not.toContain('secret-');
});

test('does not expose unserializable debug values', () => {
  const messages = [];
  debugOutput((message) => messages.push(message), 'Value', { amount: 1n }, true);
  expect(messages).toEqual(['[Value] [Unserializable debug value]\n']);
});

test('redacts sensitive plain debug strings', () => {
  const messages = [];
  debugOutput((message) => messages.push(message), 'Value', 'token=secret-token sk-test-value', true);
  expect(messages[0]).not.toContain('secret-token');
  expect(messages[0]).not.toContain('sk-test-value');
});

test('redacts quoted and whitespace-containing plain secrets', () => {
  const messages = [];
  debugOutput((message) => messages.push(message), 'Value', 'token = "secret with spaces" password: one two', true);
  expect(messages[0]).not.toContain('secret with spaces');
  expect(messages[0]).not.toContain('one');
});

test('redacts bearer authorization values', () => {
  const messages = [];
  debugOutput((message) => messages.push(message), 'Value', 'Authorization: Bearer abc123', true);
  expect(messages[0]).toBe('[Value] Authorization: Bearer [REDACTED]\n');
});
