import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { findMissingRequiredPaths } from './required-paths.mjs';
import { readConventionPackage } from './read-package.mjs';
import { walkFiles } from '../workspace/walk-files.mjs';

async function readText(cwd, readFilePath, path) {
  try { return await readFilePath(resolve(cwd, path), 'utf8'); } catch { return ''; }
}

export async function collectConventionInputs({ cwd, accessPath, readFilePath = readFile, readDirectory = readdir, exceptions = [] }) {
  const packageJson = await readConventionPackage(cwd, readFilePath);
  const configuredExceptions = Array.isArray(packageJson?.eliwareTest?.conventions?.exceptions) ? packageJson.eliwareTest.conventions.exceptions.filter((value) => typeof value === 'string') : exceptions;
  const findings = (await findMissingRequiredPaths(cwd, accessPath, configuredExceptions)).map((path) => ({ group: 'structure', message: `missing required path: ${path}` }));
  const read = (path) => readText(cwd, readFilePath, path);
  const directoryCache = new Map();
  const readDirectoryOnce = async (directory, options) => {
    const key = resolve(directory);
    if (!directoryCache.has(key)) directoryCache.set(key, await readDirectory(directory, options));
    return directoryCache.get(key);
  };
  const entries = await readDirectoryOnce(cwd, { withFileTypes: true });
  const paths = new Set(entries.map((entry) => entry.name));
  const files = new Set();
  await walkFiles(cwd, async (path) => {
    const relativePath = relative(cwd, path).replaceAll('\\', '/');
    paths.add(relativePath);
    files.add(relativePath);
  }, { readDirectory: readDirectoryOnce });
  const specEntries = paths.has('specs') ? await readDirectoryOnce(resolve(cwd, 'specs'), { withFileTypes: true }) : [];
  const specFiles = specEntries.filter((entry) => entry.isFile() && entry.name.endsWith('.md')).map((entry) => entry.name);
  const docsEntries = paths.has('docs') ? await readDirectoryOnce(resolve(cwd, 'docs'), { withFileTypes: true }) : [];
  const docsFiles = docsEntries.filter((entry) => entry.isFile() && entry.name.endsWith('.md')).map((entry) => entry.name);
  const overview = specFiles.find((file) => file.toLowerCase() === 'readme.md' || file.toLowerCase() === 'index.md') ?? (await read('SPEC.md') ? 'SPEC.md' : '');
  const specText = overview === 'SPEC.md' ? await read('SPEC.md') : await read(`specs/${overview}`);
  const examples = paths.has('examples') ? (await readDirectoryOnce(resolve(cwd, 'examples'), { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name) : [];
  const environmentSources = [];
  for (const path of paths) if (path.startsWith('src/') && /\.(?:mjs|js|cjs)$/.test(path)) environmentSources.push(await read(path));
  const exampleReadmes = new Map();
  const examplePackages = new Map();
  for (const example of examples) {
    exampleReadmes.set(example, await read(`examples/${example}/README.md`));
    examplePackages.set(example, await readConventionPackage(resolve(cwd, `examples/${example}`), readFilePath));
  }
  const specTexts = new Map(await Promise.all(specFiles.map(async (file) => [file, await read(`specs/${file}`)])));
  return { packageJson, findings, read, paths, files, specFiles, docsFiles, specText, examples, environmentSources, exampleReadmes, examplePackages, specTexts };
}
