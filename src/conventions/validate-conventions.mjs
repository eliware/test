import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { findMissingRequiredPaths } from './required-paths.mjs';
import { readConventionPackage } from './read-package.mjs';
import { checkPackageMetadata } from './package-metadata.mjs';
import { checkAgents, checkReadme, checkSpecifications } from './markdown-checks.mjs';
import { checkEnvironmentExample, checkExamples } from './environment-and-examples.mjs';
import { formatConventionFindings } from './format-findings.mjs';
import { walkFiles } from '../workspace/walk-files.mjs';

export async function validateConventions({ cwd, write, accessPath, readFilePath = readFile, readDirectory = readdir, allowCoverageOptOut = false, allowMonolithOptOut = false }) {
  const packageJson = await readConventionPackage(cwd, readFilePath);
  const exceptions = Array.isArray(packageJson?.eliwareTest?.conventions?.exceptions)
    ? packageJson.eliwareTest.conventions.exceptions.filter((value) => typeof value === 'string') : [];
  const findings = [];
  findings.push(...(await findMissingRequiredPaths(cwd, accessPath, exceptions)).map((path) => ({ group: 'structure', message: `missing required path: ${path}` })));
  const read = async (path) => { try { return await readFilePath(resolve(cwd, path), 'utf8'); } catch { return ''; } };
  const entries = await readDirectory(cwd, { withFileTypes: true });
  const paths = new Set(entries.map((entry) => entry.name));
  const files = new Set();
  try {
    await walkFiles(cwd, async (path) => {
      const relativePath = relative(cwd, path).replaceAll('\\', '/');
      paths.add(relativePath);
      files.add(relativePath);
    }, { readDirectory });
  } catch (error) {
    findings.push({ group: 'structure', message: `workspace traversal failed: ${error.message}` });
    write(formatConventionFindings(findings));
    return false;
  }
  const readme = await read('README.md');
  const agents = await read('AGENTS.md');
  const releaseNotes = await read('RELEASE_NOTES.md');
  const envExample = await read('.env.example');
  const specEntries = paths.has('specs') ? await readDirectory(resolve(cwd, 'specs'), { withFileTypes: true }) : [];
  const specFiles = specEntries.filter((entry) => entry.isFile() && entry.name.endsWith('.md')).map((entry) => entry.name);
  const overview = specFiles.find((file) => file.toLowerCase() === 'readme.md' || file.toLowerCase() === 'index.md') ?? (await read('SPEC.md') ? 'SPEC.md' : '');
  const specText = overview === 'SPEC.md' ? await read('SPEC.md') : await read(`specs/${overview}`);
  findings.push(...checkAgents(agents, exceptions));
  findings.push(...checkPackageMetadata(packageJson, { readme, releaseNotes, existingPaths: paths, existingFiles: files, allowSelfReference: packageJson?.name === '@eliware/test', allowCoverageOptOut, allowMonolithOptOut }));
  findings.push(...checkReadme(readme, paths, packageJson?.files ?? [], packageJson ?? {}));
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
