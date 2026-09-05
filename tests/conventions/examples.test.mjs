import { checkExamples } from '../../src/conventions/examples.mjs';

test('requires runnable example instructions', () => {
  expect(checkExamples([])).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('at least one') })]));
  expect(checkExamples(['demo'], new Map(), new Map())).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('setup/run') })]));
});

test('reports malformed example metadata and uses defaults', () => {
  expect(checkExamples(['broken', 'empty'], new Map([['empty', '']]), new Map([['broken', { __error: 'invalid JSON' }]]))).toEqual(expect.arrayContaining([
    expect.objectContaining({ message: expect.stringContaining('invalid JSON') }),
    expect.objectContaining({ message: expect.stringContaining('setup/run') }),
  ]));
  expect(checkExamples(['minimal'], new Map([['minimal', 'run it']]))).toEqual([]);
  expect(checkExamples(['empty'])).toEqual(expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('setup/run') })]));
});
