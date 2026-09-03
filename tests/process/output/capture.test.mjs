import { createOutputCapture } from '../../../src/process/output/capture.mjs';
test('captures stream chunks and flushes output', () => { const capture = createOutputCapture(); capture.capture(new TextDecoder())(new TextEncoder().encode('ok')); expect(capture.finish()).toContain('ok'); });
