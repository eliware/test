import { checkAgents } from './checks/agents.mjs';
import { checkReadme } from './checks/readme.mjs';
import { checkSpecifications } from './checks/specifications.mjs';
import { checkDocumentationIndexes, readDocumentationIndexes } from './checks/documentation-indexes.mjs';
import { checkPublicBadges } from './package-badges.mjs';
import { checkEnvironmentExample } from './environment.mjs';
import { checkExamples } from './examples.mjs';
import { checkPackageMetadata } from './package-metadata.mjs';

/** Run all deterministic convention checks against one collected snapshot. */
export async function runConventionChecks(snapshot) {
  const { exceptions, read, paths, files, specFiles, docsFiles, nonMarkdownFiles, exampleFiles, specText, examples, environmentSources, exampleReadmes, examplePackages, specTexts, packageJson } = snapshot;
  const findings = [...snapshot.findings];
  const packageData = packageJson ?? {};
  findings.push(...checkAgents(await read('AGENTS.md'), exceptions));
  findings.push(...checkPackageMetadata(packageJson, { readme: await read('README.md'), releaseNotes: await read('RELEASE_NOTES.md'), existingPaths: paths, existingFiles: files, allowSelfReference: packageData.name === '@eliware/test', allowCoverageOptOut: snapshot.allowCoverageOptOut, allowMonolithOptOut: snapshot.allowMonolithOptOut }));
  const readme = await read('README.md');
  findings.push(...checkReadme(readme, paths, packageData.files ?? [], packageData, { existingFiles: files, indexFiles: new Set([...files].filter((path) => /(?:^|\/)README\.md$|(?:^|\/)index\.md$/i.test(path))) }));
  findings.push(...checkPublicBadges(readme, packageData.name, packageData.repository));
  findings.push(...checkSpecifications(specFiles, specText));
  findings.push(...checkEnvironmentExample(await read('.env.example'), environmentSources.join('\n')));
  findings.push(...checkDocumentationIndexes({ docsFiles, docsReadme: await read('docs/README.md'), specFiles, specsReadme: await read('specs/README.md'), examples, examplesReadme: await read('examples/README.md'), specTexts, exampleReadmes, nonMarkdownFiles, exampleFiles, documentationTexts: new Map(await Promise.all([...files].filter((path) => /^(?:README|AGENTS)\.md$|^(?:docs|specs|examples)\/.*\.md$/.test(path)).map(async (path) => [path, await read(path)]))), docsIndexes: await readDocumentationIndexes('docs', docsFiles, read), specIndexes: await readDocumentationIndexes('specs', specFiles, read) }));
  findings.push(...checkExamples(examples, exampleReadmes, examplePackages));
  return findings;
}
