import { createTimingDecoder } from '../../src/processes/decode-timing-output.mjs';

test('decodes and flushes timing output', () => {
  const decoder = createTimingDecoder(true);
  expect(decoder.decode(new TextEncoder().encode('ok')) + decoder.flush()).toBe('ok');
});

test('does not allocate a decoder when timing is disabled', () => {
  expect(createTimingDecoder(false)).toBeNull();
});
