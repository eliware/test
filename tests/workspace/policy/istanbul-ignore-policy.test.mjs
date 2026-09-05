import { findIstanbulIgnoreViolations, isPureBarrelFile } from '../../../src/workspace/policy/istanbul-ignore-policy.mjs';
import { relative, resolve } from 'node:path';

const root = 'C:/repo';
const directive = (...words) => words.join(' ');
const filePath = (name) => resolve(root, name);

function virtualWorkspace(files) {
  const directories = new Set(['.']);
  for (const name of Object.keys(files)) {
    const parts = name.split('/');
    for (let index = 1; index < parts.length; index += 1) directories.add(parts.slice(0, index).join('/'));
  }
  const readDirectory = async (directory) => {
    const current = relative(root, directory).replaceAll('\\', '/') || '.';
    const children = new Set();
    for (const name of Object.keys(files)) {
      const parts = name.split('/');
      const prefix = current === '.' ? [] : current.split('/');
      if (parts.slice(0, prefix.length).join('/') !== prefix.join('/')) continue;
      if (parts.length > prefix.length) children.add(parts[prefix.length]);
    }
    return [...children].map((name) => ({ name, isDirectory: () => directories.has(current === '.' ? name : `${current}/${name}`), isFile: () => !directories.has(current === '.' ? name : `${current}/${name}`) }));
  };
  const readSource = async (path) => files[relative(root, path).replaceAll('\\', '/')];
  return { readDirectory, readSource };
}

test('allows Istanbul ignores in pure barrel files', async () => {
  const files = { 'index.mjs': `/* ${directive('istanbul', 'ignore', 'file')} */\nexport { value } from "./value.mjs";\n` };
  await expect(findIstanbulIgnoreViolations(root, virtualWorkspace(files))).resolves.toEqual([]);
});

test('uses the default source reader for a real fixture workspace', async () => {
  await expect(findIstanbulIgnoreViolations('test-fixtures/exclusions')).resolves.toEqual([]);
});

test('handles missing and unreadable barrel files', async () => {
  await expect(isPureBarrelFile(filePath('missing.mjs'), async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); })).resolves.toBe(false);
  await expect(isPureBarrelFile(filePath('denied.mjs'), async () => { throw Object.assign(new Error('denied'), { code: 'EACCES' }); })).rejects.toThrow('denied');
  await expect(isPureBarrelFile(filePath('barrel.mjs'), async () => 'export * from "./value.mjs";')).resolves.toBe(true);
});

test('uses the default source reader for barrel checks', async () => {
  await expect(isPureBarrelFile('src/coverage/branches.mjs')).resolves.toBe(false);
});

test('reports Istanbul ignores in executable modules with line numbers', async () => {
  const files = { 'module.mjs': `export function value() {\n  /* ${directive('istanbul', 'ignore', 'next')} */\n  return 1;\n}\n` };
  await expect(findIstanbulIgnoreViolations(root, virtualWorkspace(files))).resolves.toEqual([{ file: 'module.mjs', line: 2 }]);
});

test('reports directives in comment-only and executable files', async () => {
  const files = {
    'comment.mjs': `/* ${directive('istanbul', 'ignore', 'file')} */\n`,
    'value.mjs': `/* ${directive('istanbul', 'ignore', 'next')} */\nexport const value = 1;\n`
  };
  await expect(findIstanbulIgnoreViolations(root, virtualWorkspace(files))).resolves.toEqual([{ file: 'comment.mjs', line: 1 }, { file: 'value.mjs', line: 1 }]);
});

test('reads source files with at most six concurrent workers and preserves order', async () => {
  const files = Object.fromEntries(['01', '02', '03', '04', '05', '06', '07'].map((name) => [`many/${name}.mjs`, 'placeholder']));
  let active = 0;
  let maximum = 0;
  const workspace = virtualWorkspace(files);
  await expect(findIstanbulIgnoreViolations(root, {
    readDirectory: workspace.readDirectory,
    readSource: async () => {
      active += 1;
      maximum = Math.max(maximum, active);
      await new Promise((resolveResult) => setTimeout(resolveResult, 1));
      active -= 1;
      return `/* ${directive('istanbul', 'ignore', 'next')} */\nexport const value = 1;\n`;
    }
  })).resolves.toHaveLength(7);
  expect(maximum).toBeLessThanOrEqual(6);
});
