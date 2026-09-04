import { findIstanbulIgnoreViolations, isPureBarrelFile, isPureBarrelSource } from '../../../src/workspace/policy/istanbul-ignore-policy.mjs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const fixture = join(process.cwd(), 'test-fixtures', 'istanbul-policy');
const directive = (...words) => words.join(' ');

beforeEach(async () => {
  await mkdir(fixture, { recursive: true });
});

afterEach(async () => {
  await rm(fixture, { recursive: true, force: true });
});

test('allows Istanbul ignores in pure barrel files', async () => {
  await writeFile(join(fixture, 'index.mjs'), `/* ${'istanbul ignore file'} */\nexport { value } from "./value.mjs";\n`);
  await expect(findIstanbulIgnoreViolations(fixture)).resolves.toEqual([]);
});

test('classifies barrel sources and handles missing files', async () => {
  expect(isPureBarrelSource('export { value } from "./value.mjs";')).toBe(true);
  expect(isPureBarrelSource('export const value = 1;')).toBe(false);
  await expect(isPureBarrelFile(join(fixture, 'missing.mjs'))).resolves.toBe(false);
  await expect(isPureBarrelFile(join(fixture, 'denied.mjs'), async () => { throw Object.assign(new Error('denied'), { code: 'EACCES' }); })).rejects.toThrow('denied');
  await writeFile(join(fixture, 'barrel.mjs'), 'export * from "./value.mjs";\n');
  await expect(isPureBarrelFile(join(fixture, 'barrel.mjs'))).resolves.toBe(true);
});

test('reports Istanbul ignores in executable modules with line numbers', async () => {
  await writeFile(join(fixture, 'module.mjs'), `export function value() {\n  /* ${directive('istanbul', 'ignore', 'next')} */\n  return 1;\n}\n`);
  await expect(findIstanbulIgnoreViolations(fixture)).resolves.toEqual([{ file: 'module.mjs', line: 2 }]);
});

test('scans supported source extensions and skips generated directories', async () => {
  await mkdir(join(fixture, 'coverage'), { recursive: true });
  await mkdir(join(fixture, 'nested'), { recursive: true });
  await writeFile(join(fixture, 'coverage', 'generated.mjs'), `/* ${directive('istanbul', 'ignore', 'file')} */\n`);
  await writeFile(join(fixture, 'nested', 'clean.mjs'), 'export const value = 1;\n');
  await writeFile(join(fixture, 'notes.txt'), `/* ${directive('istanbul', 'ignore', 'file')} */\n`);
  await writeFile(join(fixture, 'module.ts'), `/* ${directive('istanbul', 'ignore', 'else')} */\nexport const value = 1;\n`);
  await expect(findIstanbulIgnoreViolations(fixture)).resolves.toEqual([{ file: 'module.ts', line: 1 }]);
});

test('does not classify comment-only files or executable exports as pure barrels', async () => {
  await writeFile(join(fixture, 'comment.mjs'), `/* ${directive('istanbul', 'ignore', 'file')} */\n`);
  await writeFile(join(fixture, 'value.mjs'), `/* ${directive('istanbul', 'ignore', 'next')} */\nexport const value = 1;\n`);
  await expect(findIstanbulIgnoreViolations(fixture)).resolves.toEqual([
    { file: 'comment.mjs', line: 1 },
    { file: 'value.mjs', line: 1 }
  ]);
});

test('reads source files with at most six concurrent workers and preserves order', async () => {
  await mkdir(join(fixture, 'many'), { recursive: true });
  for (const name of ['01.mjs', '02.mjs', '03.mjs', '04.mjs', '05.mjs', '06.mjs', '07.mjs']) {
    await writeFile(join(fixture, 'many', name), `/* ${directive('istanbul', 'ignore', 'next')} */\nexport const value = 1;\n`);
  }
  let active = 0;
  let maximum = 0;
  await expect(findIstanbulIgnoreViolations(fixture, {
    readSource: async (_path) => {
      active += 1;
      maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active -= 1;
      return `/* ${directive('istanbul', 'ignore', 'next')} */\nexport const value = 1;\n`;
    }
  })).resolves.toHaveLength(7);
  expect(maximum).toBeLessThanOrEqual(6);
});
