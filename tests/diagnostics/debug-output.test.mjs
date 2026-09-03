import { debugOutput } from '../../src/diagnostics/debug-output.mjs';

test('writes structured debug output only when enabled', () => {
  const messages = [];
  debugOutput((message) => messages.push(message), 'Args', ['--watch'], true);
  expect(messages).toEqual(['[Args] ["--watch"]\n']);
  debugOutput((message) => messages.push(message), 'Hidden', 'x', false);
  expect(messages).toHaveLength(1);
});
