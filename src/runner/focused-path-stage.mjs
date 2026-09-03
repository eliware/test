import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { VALUE_OPTIONS } from '../arguments.mjs';

export function isTestPath(argument) {
  return isFileLikePath(argument) && /(?:^|[\\/])(?:tests?|spec)(?:[\\/]|$)/i.test(argument);
}

function isFileLikePath(argument) {
  return !argument.startsWith('-') && !/[*!?[\]{}]/.test(argument)
    && /(?:\.(?:c|m)?js|jsx|tsx|cts|mts|ts)$/i.test(argument);
}

export async function focusedCoverageArguments(cwd, testPaths, accessPath = access) {
  const uniquePaths = [...new Set(testPaths)];
  const sourcePaths = await Promise.all(uniquePaths.map((testPath) => sourcePathForTest(cwd, testPath, accessPath)));
  if (sourcePaths.some((sourcePath) => !sourcePath)) return [];
  return [...new Set(sourcePaths)].flatMap((sourcePath) => ['--collectCoverageFrom', sourcePath]);
}

async function sourcePathForTest(cwd, testPath, accessPath = access) {
  const normalized = testPath.replaceAll('\\', '/').replace(/^\.\//, '');
  const marker = normalized.match(/^(.*?)(?:tests?|spec)\/(.*)$/i);
  const sourceRelative = marker[2]
    .replace(/\.(?:test|spec)(?=\.[^.]+$)/i, '')
    .replace(/\.[^.]+$/, '');
  const testExtension = marker[2].slice(marker[2].lastIndexOf('.') + 1).toLowerCase();
  const sourceExtensions = [testExtension, ...['js', 'mjs', 'cjs', 'ts', 'mts', 'cts', 'jsx', 'tsx'].filter((extension) => extension !== testExtension)];
  const matches = [];
  for (const sourceExtension of sourceExtensions) {
    for (const candidate of [`src/${sourceRelative}.${sourceExtension}`, `src/${sourceRelative}/index.${sourceExtension}`]) {
      try { await accessPath(resolve(cwd, candidate)); matches.push(candidate); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
  }
  return matches.length === 1 ? matches[0] : '';
}

export async function findMissingFocusedPath(cwd, argumentsList, accessPath = access) {
  const candidates = positionalArguments(argumentsList).filter(isTestPath);
  for (const candidate of candidates) {
    try { await accessPath(resolve(cwd, candidate.replaceAll('\\', '/'))); }
    catch (error) { if (error.code !== 'ENOENT') throw error; return candidate; }
  }
  return '';
}

function positionalArguments(argumentsList) {
  const values = [];
  const valueOptions = new Set(VALUE_OPTIONS);
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (valueOptions.has(argument)) {
      if (index + 1 >= argumentsList.length) throw new Error(`${argument} requires a value.`);
      index += 1;
      continue;
    }
    if (!argument.startsWith('-')) values.push(argument);
  }
  return values;
}
