import { debugOutput } from '../../src/diagnostics/debug-output.mjs';

test('writes only the safe coverage fallback diagnostic', () => {
  const messages = [];
  debugOutput((message) => messages.push(message), 'Args', ['--watch'], true);
  debugOutput((message) => messages.push(message), 'Coverage fallback', 'using Jest text coverage', true);
  expect(messages).toEqual(['[Coverage fallback] using Jest text coverage\n']);
  debugOutput((message) => messages.push(message), 'Hidden', 'x', false);
  expect(messages).toHaveLength(1);
});

test('ignores arbitrary debug values safely', () => {
  const messages = [];
  const circular = {};
  circular.self = circular;

  debugOutput(null, 'Ignored', 'value', true);
  debugOutput((message) => messages.push(message), '', circular, true);
  debugOutput((message) => messages.push(message), 'Text', 'plain', true);
  debugOutput(() => {}, 'Default', 'ignored');

  expect(messages).toEqual([]);
});

test('does not serialize structured debug fields', () => {
  const messages = [];
  debugOutput((message) => messages.push(message), 'Config', {
    token: 'secret-token',
    nested: { password: 'secret-password' },
    safe: 'visible',
  }, true);
  expect(messages).toEqual([]);
});

test('does not expose unserializable debug values', () => {
  const messages = [];
  debugOutput((message) => messages.push(message), 'Value', { amount: 1n }, true);
  expect(messages).toEqual([]);
});

test('redacts sensitive plain debug strings', () => {
  const messages = [];
  debugOutput((message) => messages.push(message), 'Value', 'token=secret-token sk-test-value', true);
  expect(messages).toEqual([]);
});

test('redacts quoted and whitespace-containing plain secrets', () => {
  const messages = [];
  debugOutput((message) => messages.push(message), 'Value', 'token = "secret with spaces" password: one two', true);
  expect(messages).toEqual([]);
});

test('redacts bearer authorization values', () => {
  const messages = [];
  debugOutput((message) => messages.push(message), 'Value', 'Authorization: Bearer abc123', true);
  expect(messages).toEqual([]);
});
