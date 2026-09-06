import { resolve } from 'node:path';
import { readConventionPackage } from './read-package.mjs';

/** Load specification, example, and environment inputs from a file snapshot. */
export async function collectDocumentInputs({ cwd, read, readDirectoryOnce, paths, specFiles }) {
  const overview = specFiles.find((file) => file.toLowerCase() === 'readme.md' || file.toLowerCase() === 'index.md') ?? (await read('SPEC.md') ? 'SPEC.md' : '');
  const specText = overview === 'SPEC.md' ? await read('SPEC.md') : await read(`specs/${overview}`);
  const examples = paths.has('examples') ? (await readDirectoryOnce(resolve(cwd, 'examples'), { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name) : [];
  const environmentSources = [];
  for (const path of paths) if (path.startsWith('src/') && /\.(?:mjs|js|cjs)$/.test(path)) environmentSources.push(await read(path));
  const exampleReadmes = new Map();
  const examplePackages = new Map();
  for (const example of examples) {
    exampleReadmes.set(example, await read(`examples/${example}/README.md`));
    examplePackages.set(example, await readConventionPackage(resolve(cwd, `examples/${example}`), read.readFile));
  }
  const specTextEntries = await Promise.all(specFiles.map(async (file) => [file, await read(`specs/${file}`)]));
  if (overview === 'SPEC.md') specTextEntries.push(['SPEC.md', specText]);
  const specTexts = new Map(specTextEntries);
  return { specText, examples, environmentSources, exampleReadmes, examplePackages, specTexts };
}
