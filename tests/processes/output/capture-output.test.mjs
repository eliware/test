import { createOutputCapture } from '../../../src/processes/output/capture-output.mjs';

test('captures stream chunks and flushes output', () => {
  const capture = createOutputCapture();
  capture.capture('stdout')(new TextEncoder().encode('ok'));
  expect(capture.finish()).toContain('ok');
});

test('captures stderr and appends startup errors', () => {
  const capture = createOutputCapture();
  capture.capture('stderr')(new TextEncoder().encode('failure'));
  expect(capture.finish(' could not start')).toBe('failure could not start');
});
