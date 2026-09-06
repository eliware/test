import { checkAgents } from './checks/agents.mjs';
import { checkReadme } from './checks/readme.mjs';
import { checkPublicBadges } from './package-badges.mjs';
import { checkPackageMetadata } from './package-metadata.mjs';
import { checkRepositoryDriftFiles } from './checks/drift-files.mjs';

/** Run package, README, agent, and branding checks over a convention snapshot. */
export async function runCoreConventionChecks(snapshot) {
  const { exceptions, read, paths, files, packageJson } = snapshot;
  const packageData = packageJson ?? {};
  const readme = await read('README.md');
  return [
    ...checkRepositoryDriftFiles(files),
    ...checkAgents(await read('AGENTS.md'), exceptions),
    ...checkPackageMetadata(packageJson, { readme, licenseText: await read('LICENSE'), releaseNotes: await read('RELEASE_NOTES.md'), existingPaths: paths, existingFiles: files, allowSelfReference: packageData.name === '@eliware/test', allowCoverageOptOut: snapshot.allowCoverageOptOut, allowMonolithOptOut: snapshot.allowMonolithOptOut }),
    ...checkReadme(readme, paths, packageData.files ?? [], packageData, { existingFiles: files, indexFiles: new Set([...files].filter((path) => /(?:^|\/)README\.md$|(?:^|\/)index\.md$/i.test(path))) }),
    ...checkPublicBadges(readme, packageData.name, packageData.repository),
  ];
}
