import { checkEliwareBranding } from './branding-policy.mjs';
import { checkEliwareRepository } from './repository-policy.mjs';
import { checkRuntimeMetadata } from './runtime-policy.mjs';
import { checkPublishMetadata } from './publish-policy.mjs';
import { checkBasicPackageFields } from './basic-fields.mjs';
import { checkPackageScripts } from './script-policy.mjs';
import { checkPublishablePackageFields } from './publish-fields.mjs';

function finding(message) { return { group: 'package', message }; }
export function checkPackagePolicy(packageJson, { allowSelfReference = false, allowCoverageOptOut = false, allowMonolithOptOut = false } = {}) {
  const findings = [...checkBasicPackageFields(packageJson), ...checkPackageScripts(packageJson, { allowSelfReference, allowCoverageOptOut, allowMonolithOptOut }), ...checkPublishablePackageFields(packageJson)];
  findings.push(...checkEliwareBranding(packageJson, finding), ...checkEliwareRepository(packageJson, finding));
  findings.push(...checkRuntimeMetadata(packageJson, finding), ...checkPublishMetadata(packageJson, finding));
  return findings;
}
