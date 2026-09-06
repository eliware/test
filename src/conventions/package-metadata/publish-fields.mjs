function finding(message) { return { group: 'package', message }; }

/** Validate metadata required for publishable packages. */
export function checkPublishablePackageFields(packageJson) {
  if (packageJson.private === true) return [];
  const findings = [];
  if (packageJson.repository === undefined) findings.push(finding('package.json: publishable packages must declare repository metadata'));
  if (packageJson.homepage === undefined) findings.push(finding('package.json: publishable packages must declare homepage metadata'));
  if (packageJson.exports !== undefined && (typeof packageJson.exports !== 'string' && (typeof packageJson.exports !== 'object' || packageJson.exports === null))) findings.push(finding('package.json: exports must be a string or object when present'));
  if (!Array.isArray(packageJson.files) || packageJson.files.length === 0) findings.push(finding('package.json: files must be a non-empty array for publishable packages'));
  if (!packageJson.publishConfig || typeof packageJson.publishConfig !== 'object') findings.push(finding('package.json: publishConfig must be an object for publishable packages'));
  for (const required of ['README.md', 'LICENSE', 'RELEASE_NOTES.md']) if (!packageJson.files?.includes(required)) findings.push(finding(`package.json: files must include ${required}`));
  return findings;
}
