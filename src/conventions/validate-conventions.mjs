import { readFile } from 'node:fs/promises';
import { checkAgents } from './checks/agents.mjs';
import { checkReadme } from './checks/readme.mjs';
import { checkSpecifications } from './checks/specifications.mjs';
import { checkDocumentationIndexes } from './checks/documentation-indexes.mjs';
import { checkPublicBadges } from './package-badges.mjs';
import { checkEnvironmentExample } from './environment.mjs';
import { checkExamples } from './examples.mjs';
import { checkPackageMetadata } from './package-metadata.mjs';
import { collectConventionInputs } from './collect-inputs.mjs';
import { formatConventionFindings } from './format-findings.mjs';

/** Coordinate deterministic convention checks over one collected repository snapshot. */
export async function validateConventions({ cwd, write, accessPath, readFilePath = readFile, readDirectory, allowCoverageOptOut = false, allowMonolithOptOut = false }) {
  const packageJson = await (async () => {
    try { return await collectConventionInputs({ cwd, accessPath, readFilePath, readDirectory }); }
    catch (error) {
      const findings = [{ group: 'structure', message: `workspace traversal failed: ${error.message}` }];
      write(formatConventionFindings(findings));
      return null;
    }
  })();
  if (!packageJson) return false;
  const { findings, read, paths, files, specFiles, docsFiles, specText, examples, environmentSources, exampleReadmes, examplePackages, specTexts } = packageJson;
  const exceptions = Array.isArray(packageJson.packageJson?.eliwareTest?.conventions?.exceptions)
    ? packageJson.packageJson.eliwareTest.conventions.exceptions.filter((value) => typeof value === 'string') : [];
  findings.push(...checkAgents(await read('AGENTS.md'), exceptions));
  findings.push(...checkPackageMetadata(packageJson.packageJson, { readme: await read('README.md'), releaseNotes: await read('RELEASE_NOTES.md'), existingPaths: paths, existingFiles: files, allowSelfReference: packageJson.packageJson?.name === '@eliware/test', allowCoverageOptOut, allowMonolithOptOut }));
  const packageData = packageJson.packageJson ?? {};
  const readme = await read('README.md');
  findings.push(...checkReadme(readme, paths, packageData.files ?? [], packageData, { existingFiles: files, indexFiles: new Set([...files].filter((path) => /(?:^|\/)README\.md$|(?:^|\/)index\.md$/i.test(path))) }));
  findings.push(...checkPublicBadges(readme, packageData.name, packageData.repository));
  findings.push(...checkSpecifications(specFiles, specText));
  findings.push(...checkEnvironmentExample(await read('.env.example'), environmentSources.join('\n')));
  findings.push(...checkDocumentationIndexes({ docsFiles, docsReadme: await read('docs/README.md'), specFiles, specsReadme: await read('specs/README.md'), examples, examplesReadme: await read('examples/README.md'), specTexts, exampleReadmes }));
  findings.push(...checkExamples(examples, exampleReadmes, examplePackages));
  if (findings.length) write(formatConventionFindings(findings));
  return findings.length === 0;
}
