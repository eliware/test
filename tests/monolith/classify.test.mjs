import { classifyMonolithFile } from '../../src/monolith/classify.mjs';
test('classifies source and tests', () => { expect(classifyMonolithFile('src/a.mjs')).toBe('source'); expect(classifyMonolithFile('tests/a.test.mjs')).toBe('test'); });
test('classifies Windows-style relative paths', () => { expect(classifyMonolithFile('src\\a.mjs')).toBe('source'); expect(classifyMonolithFile('tests\\a.test.mjs')).toBe('test'); });
