import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { findMissingRequiredPaths } from './required-paths.mjs';
import { readConventionPackage } from './read-package.mjs';
import { walkFiles } from '../workspace/walk-files.mjs';

export async function collectConventionInputs({ cwd, accessPath, readFilePath = readFile, readDirectory = readdir, exceptions = [] }) {
  const contentCache = new Map();
  const cachedReadFile = async (path, encoding) => {
    const key = resolve(path);
    if (!contentCache.has(key)) contentCache.set(key, await readFilePath(path, encoding));
    return contentCache.get(key);
  };
  const readText = async (path) => {
    try { return await cachedReadFile(resolve(cwd, path), 'utf8'); } catch { return ''; }
  };
  const packageJson = await readConventionPackage(cwd, cachedReadFile);
  const configuredExceptions = Array.isArray(packageJson?.eliwareTest?.conventions?.exceptions) ? packageJson.eliwareTest.conventions.exceptions.filter((value) => typeof value === 'string') : exceptions;
  const findings = (await findMissingRequiredPaths(cwd, accessPath, configuredExceptions)).map((path) => ({ group: 'structure', message: `missing required path: ${path}` }));
  const read = (path) => readText(path);
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
  const specFiles = [...files].filter((path) => path.startsWith('specs/') && path.endsWith('.md')).map((path) => path.slice('specs/'.length));
  const docsFiles = [...files].filter((path) => path.startsWith('docs/') && path.endsWith('.md')).map((path) => path.slice('docs/'.length));
  const nonMarkdownFiles = [...files].filter((path) => /^(?:docs|specs)\//.test(path) && !path.endsWith('.md'));
  const exampleFiles = [...files].filter((path) => path.startsWith('examples/') && path !== 'examples/README.md' && !path.toLowerCase().endsWith('/readme.md')).map((path) => path.slice('examples/'.length));
  const overview = specFiles.find((file) => file.toLowerCase() === 'readme.md' || file.toLowerCase() === 'index.md') ?? (await read('SPEC.md') ? 'SPEC.md' : '');
  const specText = overview === 'SPEC.md' ? await read('SPEC.md') : await read(`specs/${overview}`);
  const examples = paths.has('examples') ? (await readDirectoryOnce(resolve(cwd, 'examples'), { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name) : [];
  const environmentSources = [];
  for (const path of paths) if (path.startsWith('src/') && /\.(?:mjs|js|cjs)$/.test(path)) environmentSources.push(await read(path));
  const exampleReadmes = new Map();
  const examplePackages = new Map();
  for (const example of examples) {
    exampleReadmes.set(example, await read(`examples/${example}/README.md`));
    examplePackages.set(example, await readConventionPackage(resolve(cwd, `examples/${example}`), cachedReadFile));
  }
  const specTexts = new Map(await Promise.all(specFiles.map(async (file) => [file, await read(`specs/${file}`)])));
  return { packageJson, exceptions: configuredExceptions, findings, read, paths, files, specFiles, docsFiles, nonMarkdownFiles, exampleFiles, specText, examples, environmentSources, exampleReadmes, examplePackages, specTexts };
}
