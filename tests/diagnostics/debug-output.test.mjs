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

  expect(messages).toEqual(['[debug] [object Object]\n', '[Text] plain\n']);
});
