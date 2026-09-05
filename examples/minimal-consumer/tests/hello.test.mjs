import { hello } from '../src/hello.mjs';

test('greets the supplied name', () => {
  expect(hello('Eliware')).toBe('Hello, Eliware!');
});

test('uses the default greeting', () => {
  expect(hello()).toBe('Hello, world!');
});
