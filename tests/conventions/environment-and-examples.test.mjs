import { checkEnvironmentExample, checkExamples } from '../../src/conventions/environment-and-examples.mjs';

test('requires documented safe environment assignments', () => {
  expect(checkEnvironmentExample('# OPTIONAL=unset\nREQUIRED=', 'process.env.REQUIRED')).toEqual(expect.arrayContaining([{ group: 'environment', message: '.env.example: required variable REQUIRED needs a placeholder value' }]));
  expect(checkEnvironmentExample('# OPTIONAL=unset', 'process.env.MISSING')).toEqual(expect.arrayContaining([{ group: 'environment', message: '.env.example: missing documented environment variable MISSING' }]));
  expect(checkEnvironmentExample('TOKEN=real-token\n# OPTIONAL=', '')).toEqual(expect.arrayContaining([
    { group: 'environment', message: '.env.example: TOKEN must not contain a credential-like value' },
    { group: 'environment', message: '.env.example: optional variable OPTIONAL needs an explicit default' },
  ]));
});

test('requires at least one runnable example', () => {
  expect(checkExamples([], new Map(), new Map())).toEqual([{ group: 'examples', message: 'examples/: must contain at least one example' }]);
  expect(checkExamples(['minimal'], new Map([['minimal', 'run it']]), new Map([['minimal', {}]]))).toEqual([]);
  expect(checkExamples(['broken', 'empty'], new Map([['empty', '']]), new Map([['broken', { __error: 'invalid JSON' }]]))).toEqual(expect.arrayContaining([
    { group: 'examples', message: 'examples/broken/package.json: invalid JSON' },
    { group: 'examples', message: 'examples/empty: missing setup/run instructions' },
  ]));
});

test('uses default source and example maps', () => {
  expect(checkEnvironmentExample('')).toEqual([]);
  expect(checkExamples(['minimal'], new Map([['minimal', 'run it']]))).toEqual([]);
  expect(checkExamples(['empty'])).toEqual([{ group: 'examples', message: 'examples/empty: missing setup/run instructions' }]);
});
