function finding(message) { return { group: 'package', message }; }

/** Validate the shared test/lint script and self-hosting contracts. */
export function checkPackageScripts(packageJson, { allowSelfReference = false, allowCoverageOptOut = false, allowMonolithOptOut = false } = {}) {
  const findings = [];
  if (typeof packageJson.scripts?.test !== 'string' || packageJson.scripts.test.trim() === '') findings.push(finding('package.json: scripts.test must be a non-empty string'));
  if (typeof packageJson.scripts?.lint !== 'string' || packageJson.scripts.lint.trim() === '') findings.push(finding('package.json: scripts.lint must be a non-empty string'));
  if (!allowSelfReference && !/\beliware-test\b/.test(packageJson.scripts?.test ?? '')) findings.push(finding('package.json: scripts.test must invoke eliware-test'));
  if (!allowSelfReference) { const lint = packageJson.scripts?.lint ?? ''; if (!/\beliware-test\b/.test(lint)) findings.push(finding('package.json: scripts.lint must invoke eliware-test --lint')); else if (!/--lint(?:\s|$)/.test(lint)) findings.push(finding('package.json: scripts.lint must invoke eliware-test --lint')); }
  if (allowSelfReference && !/node\s+bin[\\/]eliware-test\.mjs(?:\s|$)/.test(packageJson.scripts?.test ?? '')) findings.push(finding('package.json: self-hosted scripts.test must execute node bin/eliware-test.mjs'));
  if (allowSelfReference && !/node\s+bin[\\/]eliware-test\.mjs(?:\s|$)/.test(packageJson.scripts?.lint ?? '')) findings.push(finding('package.json: self-hosted scripts.lint must execute node bin/eliware-test.mjs'));
  if (!allowCoverageOptOut && /(?:^|\s)--ignore-100x4(?:\s|$)/.test(packageJson.scripts?.test ?? '')) findings.push(finding('package.json: scripts.test must not include --ignore-100x4 unless coverage enforcement is explicitly disabled'));
  if (!allowMonolithOptOut && /(?:^|\s)--ignore-monolith-limits(?:\s|$)/.test(packageJson.scripts?.test ?? '')) findings.push(finding('package.json: scripts.test must not include --ignore-monolith-limits unless monolith enforcement is explicitly disabled'));
  return findings;
}
