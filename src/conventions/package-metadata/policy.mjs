import { checkEliwareBranding } from './branding-policy.mjs';
import { checkEliwareRepository } from './repository-policy.mjs';

const REQUIRED_STRING_FIELDS = ['name', 'version', 'description', 'author', 'license'];
function finding(message) { return { group: 'package', message }; }
function isHttpUrl(value) { try { const url = new URL(String(value)); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; } }
export function checkPackagePolicy(packageJson, { allowSelfReference = false, allowCoverageOptOut = false, allowMonolithOptOut = false } = {}) {
  const findings = [];
  for (const field of REQUIRED_STRING_FIELDS) if (typeof packageJson[field] !== 'string' || packageJson[field].trim() === '') findings.push(finding(`package.json: ${field} must be a non-empty string`));
  if (!Array.isArray(packageJson.keywords) || packageJson.keywords.length === 0 || packageJson.keywords.some((item) => typeof item !== 'string' || item.trim() === '')) findings.push(finding('package.json: keywords must be a non-empty string array'));
  for (const field of ['repository', 'bugs', 'homepage']) { const value = typeof packageJson[field] === 'string' ? packageJson[field] : packageJson[field]?.url; if (value !== undefined && !isHttpUrl(value)) findings.push(finding(`package.json: ${field} URL must be a valid http:// or https:// URL`)); }
  if (packageJson.engines !== undefined && (typeof packageJson.engines !== 'object' || typeof packageJson.engines.node !== 'string' || packageJson.engines.node.trim() === '')) findings.push(finding('package.json: engines.node must be a non-empty string when present'));
  if (typeof packageJson.scripts?.test !== 'string' || packageJson.scripts.test.trim() === '') findings.push(finding('package.json: scripts.test must be a non-empty string'));
  if (typeof packageJson.scripts?.lint !== 'string' || packageJson.scripts.lint.trim() === '') findings.push(finding('package.json: scripts.lint must be a non-empty string'));
  if (!allowSelfReference && !/\beliware-test\b/.test(packageJson.scripts?.test ?? '')) findings.push(finding('package.json: scripts.test must invoke eliware-test'));
  if (!allowSelfReference) {
    const lint = packageJson.scripts?.lint ?? '';
    if (!/\beliware-test\b/.test(lint)) findings.push(finding('package.json: scripts.lint must invoke eliware-test --lint'));
    else if (!/--lint(?:\s|$)/.test(lint)) findings.push(finding('package.json: scripts.lint must invoke eliware-test --lint'));
  }
  if (allowSelfReference && !/node\s+bin[\\/]eliware-test\.mjs(?:\s|$)/.test(packageJson.scripts?.test ?? '')) findings.push(finding('package.json: self-hosted scripts.test must execute node bin/eliware-test.mjs'));
  if (allowSelfReference && !/node\s+bin[\\/]eliware-test\.mjs(?:\s|$)/.test(packageJson.scripts?.lint ?? '')) findings.push(finding('package.json: self-hosted scripts.lint must execute node bin/eliware-test.mjs'));
  if (!allowCoverageOptOut && /(?:^|\s)--ignore-100x4(?:\s|$)/.test(packageJson.scripts?.test ?? '')) findings.push(finding('package.json: scripts.test must not include --ignore-100x4 unless coverage enforcement is explicitly disabled'));
  if (!allowMonolithOptOut && /(?:^|\s)--ignore-monolith-limits(?:\s|$)/.test(packageJson.scripts?.test ?? '')) findings.push(finding('package.json: scripts.test must not include --ignore-monolith-limits unless monolith enforcement is explicitly disabled'));
  if (packageJson.private !== true) { if (packageJson.repository === undefined) findings.push(finding('package.json: publishable packages must declare repository metadata')); if (packageJson.homepage === undefined) findings.push(finding('package.json: publishable packages must declare homepage metadata')); if (packageJson.exports !== undefined && (typeof packageJson.exports !== 'string' && (typeof packageJson.exports !== 'object' || packageJson.exports === null))) findings.push(finding('package.json: exports must be a string or object when present')); if (!Array.isArray(packageJson.files) || packageJson.files.length === 0) findings.push(finding('package.json: files must be a non-empty array for publishable packages')); if (!packageJson.publishConfig || typeof packageJson.publishConfig !== 'object') findings.push(finding('package.json: publishConfig must be an object for publishable packages')); for (const required of ['README.md', 'LICENSE', 'RELEASE_NOTES.md']) if (!packageJson.files?.includes(required)) findings.push(finding(`package.json: files must include ${required}`)); }
  findings.push(...checkEliwareBranding(packageJson, finding), ...checkEliwareRepository(packageJson, finding));
  return findings;
}
