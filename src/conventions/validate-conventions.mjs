import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { findMissingRequiredPaths } from './required-paths.mjs';
import { readConventionPackage } from './read-package.mjs';
import { checkPackageMetadata } from './package-metadata.mjs';
import { checkReadme, checkSpecifications } from './markdown-checks.mjs';
import { checkEnvironmentExample, checkExamples } from './environment-and-examples.mjs';
import { formatConventionFindings } from './format-findings.mjs';

export async function validateConventions({ cwd, write, accessPath, readFilePath = readFile, readDirectory = readdir }) {
  const packageJson = await readConventionPackage(cwd, readFilePath);
  const exceptions = Array.isArray(packageJson?.eliwareTest?.conventions?.exceptions)
    ? packageJson.eliwareTest.conventions.exceptions.filter((value) => typeof value === 'string') : [];
  const findings = [];
  findings.push(...(await findMissingRequiredPaths(cwd, accessPath, exceptions)).map((path) => ({ group: 'structure', message: `missing required path: ${path}` })));
  const read = async (path) => { try { return await readFilePath(resolve(cwd, path), 'utf8'); } catch { return ''; } };
  const entries = await readDirectory(cwd, { withFileTypes: true });
  const paths = new Set(entries.map((entry) => entry.name));
  const collectPaths = async (directory, prefix = '') => {
    for (const entry of await readDirectory(directory, { withFileTypes: true })) {
      if (['.git', 'node_modules', 'coverage', '.eliware-test-coverage'].includes(entry.name)) continue;
      const relative = `${prefix}${entry.name}`;
      paths.add(relative);
      if (entry.isDirectory()) await collectPaths(resolve(directory, entry.name), `${relative}/`);
    }
  };
  await collectPaths(cwd);
  const readme = await read('README.md');
  const releaseNotes = await read('RELEASE_NOTES.md');
  const envExample = await read('.env.example');
  const specEntries = paths.has('specs') ? await readDirectory(resolve(cwd, 'specs'), { withFileTypes: true }) : [];
  const specFiles = specEntries.filter((entry) => entry.isFile() && entry.name.endsWith('.md')).map((entry) => entry.name);
  const overview = specFiles.find((file) => file.toLowerCase() === 'readme.md' || file.toLowerCase() === 'index.md') ?? (await read('SPEC.md') ? 'SPEC.md' : '');
  const specText = overview === 'SPEC.md' ? await read('SPEC.md') : await read(`specs/${overview}`);
  findings.push(...checkPackageMetadata(packageJson, { readme, releaseNotes, existingPaths: paths }));
  findings.push(...checkReadme(readme, paths, packageJson?.files ?? []));
  findings.push(...checkSpecifications(specFiles, specText, specFiles.find((file) => /out.of.scope/i.test(file))));
  const environmentSources = [];
  for (const relative of paths) {
    if (!relative.startsWith('src/') || !/\.(?:mjs|js|cjs)$/.test(relative)) continue;
    environmentSources.push(await read(relative));
  }
  findings.push(...checkEnvironmentExample(envExample, environmentSources.join('\n')));
  const exampleEntries = paths.has('examples') ? await readDirectory(resolve(cwd, 'examples'), { withFileTypes: true }) : [];
  const examples = exampleEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const exampleReadmes = new Map();
  const examplePackages = new Map();
  for (const example of examples) {
    exampleReadmes.set(example, await read(`examples/${example}/README.md`));
    examplePackages.set(example, await readConventionPackage(resolve(cwd, `examples/${example}`), readFilePath));
  }
  findings.push(...checkExamples(examples, exampleReadmes, examplePackages));
  if (findings.length) write(formatConventionFindings(findings));
  return findings.length === 0;
}
