import { classifyFile, isGeneratedFile } from '../../src/monolith/classify-file.mjs';

test('classifies source, tests, and generated files', () => {
  expect(classifyFile('src/example.mjs')).toBe('source');
  expect(classifyFile('tests/example.test.mjs')).toBe('test');
  expect(classifyFile('docs/example.md')).toBe('');
  expect(isGeneratedFile('src/generated/example.mjs', '')).toBe(true);
});
