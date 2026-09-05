const REQUIRED_STRING_FIELDS = ['name', 'version', 'description', 'author', 'license'];

function finding(message) { return { group: 'package', message }; }

export function checkPackageMetadata(packageJson, { readme = '', releaseNotes = '', existingPaths = new Set(), existingFiles = existingPaths, allowSelfReference = false, allowCoverageOptOut = false, allowMonolithOptOut = false } = {}) {
  if (packageJson === null) return [];
  if (packageJson?.__error) return [finding(`package.json: ${packageJson.__error}`)];
  const findings = [];
  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof packageJson[field] !== 'string' || packageJson[field].trim() === '') findings.push(finding(`package.json: ${field} must be a non-empty string`));
  }
  if (!Array.isArray(packageJson.keywords) || packageJson.keywords.length === 0 || packageJson.keywords.some((item) => typeof item !== 'string' || item.trim() === '')) findings.push(finding('package.json: keywords must be a non-empty string array'));
  for (const field of ['repository', 'bugs', 'homepage']) {
    const value = typeof packageJson[field] === 'string' ? packageJson[field] : packageJson[field]?.url;
    if (value !== undefined && !isHttpUrl(value)) findings.push(finding(`package.json: ${field} URL must be a valid http:// or https:// URL`));
  }
  if (packageJson.engines !== undefined && (typeof packageJson.engines !== 'object' || typeof packageJson.engines.node !== 'string' || packageJson.engines.node.trim() === '')) findings.push(finding('package.json: engines.node must be a non-empty string when present'));
  if (typeof packageJson.scripts?.test !== 'string' || packageJson.scripts.test.trim() === '') findings.push(finding('package.json: scripts.test must be a non-empty string'));
  if (typeof packageJson.scripts?.lint !== 'string' || packageJson.scripts.lint.trim() === '') findings.push(finding('package.json: scripts.lint must be a non-empty string'));
  if (!allowSelfReference && !/\beliware-test\b/.test(packageJson.scripts?.test ?? '')) findings.push(finding('package.json: scripts.test must invoke eliware-test'));
  if (!allowSelfReference && !/\beliware-test\b/.test(packageJson.scripts?.lint ?? '')) findings.push(finding('package.json: scripts.lint must invoke eliware-test --lint'));
  if (!allowSelfReference && !/--lint(?:\s|$)/.test(packageJson.scripts?.lint ?? '')) findings.push(finding('package.json: scripts.lint must invoke eliware-test --lint'));
  if (allowSelfReference && !/node\s+bin[\\/]eliware-test\.mjs(?:\s|$)/.test(packageJson.scripts?.test ?? '')) findings.push(finding('package.json: self-hosted scripts.test must execute node bin/eliware-test.mjs'));
  if (allowSelfReference && !/node\s+bin[\\/]eliware-test\.mjs(?:\s|$)/.test(packageJson.scripts?.lint ?? '')) findings.push(finding('package.json: self-hosted scripts.lint must execute node bin/eliware-test.mjs'));
  if (!allowCoverageOptOut && /(?:^|\s)--ignore-100x4(?:\s|$)/.test(packageJson.scripts?.test ?? '')) findings.push(finding('package.json: scripts.test must not include --ignore-100x4 unless coverage enforcement is explicitly disabled'));
  if (!allowMonolithOptOut && /(?:^|\s)--ignore-monolith-limits(?:\s|$)/.test(packageJson.scripts?.test ?? '')) findings.push(finding('package.json: scripts.test must not include --ignore-monolith-limits unless monolith enforcement is explicitly disabled'));
  const publishable = packageJson.private !== true;
  if (publishable) {
    if (packageJson.repository === undefined) findings.push(finding('package.json: publishable packages must declare repository metadata'));
    if (packageJson.homepage === undefined) findings.push(finding('package.json: publishable packages must declare homepage metadata'));
    if (packageJson.exports !== undefined && (typeof packageJson.exports !== 'string' && (typeof packageJson.exports !== 'object' || packageJson.exports === null))) findings.push(finding('package.json: exports must be a string or object when present'));
    if (!Array.isArray(packageJson.files) || packageJson.files.length === 0) findings.push(finding('package.json: files must be a non-empty array for publishable packages'));
    if (!packageJson.publishConfig || typeof packageJson.publishConfig !== 'object') findings.push(finding('package.json: publishConfig must be an object for publishable packages'));
    for (const required of ['README.md', 'LICENSE', 'RELEASE_NOTES.md']) if (!packageJson.files?.includes(required)) findings.push(finding(`package.json: files must include ${required}`));
  }
  for (const [name, target] of normalizeBinEntries(packageJson.bin)) {
    const normalizedTarget = normalizePackagePath(target);
    if (!normalizedTarget || !existingFiles.has(normalizedTarget)) findings.push(finding(`package.json: bin.${name} target does not exist: ${target}`));
  }
  if (packageJson.name && !readme.includes(packageJson.name)) findings.push(finding(`README.md: does not mention package name ${packageJson.name}`));
  if (packageJson.version && !new RegExp(`^##\\s+v?${escapeRegExp(packageJson.version)}(?:\\s|$)`, 'mi').test(releaseNotes)) findings.push(finding(`RELEASE_NOTES.md: missing heading for version ${packageJson.version}`));
  if (packageJson.license && ![...existingPaths].some((path) => path.toLowerCase() === packageJson.license.toLowerCase() || path.toLowerCase() === 'license')) findings.push(finding(`package.json: license ${packageJson.license} has no corresponding license file`));
  for (const entry of packageJson.files ?? []) {
    if (typeof entry !== 'string') continue;
    const normalized = entry.replace(/\/$/, '');
    const pattern = entry.includes('*')
      ? new RegExp(`^${escapeRegExp(normalized).replaceAll('\\*', '.*')}(?:/|$)`)
      : null;
    const exists = pattern ? [...existingPaths].some((path) => pattern.test(path))
      : entry.endsWith('/') ? [...existingPaths].some((path) => path.startsWith(`${normalized}/`)) || existingPaths.has(normalized)
        : existingPaths.has(normalized);
    if (!exists) findings.push(finding(`package.json: files entry does not exist: ${entry}`));
  }
  return findings;
}

function normalizeBinEntries(bin) {
  if (typeof bin === 'string') return [['default', bin]];
  if (!bin || typeof bin !== 'object' || Array.isArray(bin)) return [];
  return Object.entries(bin).filter(([, target]) => typeof target === 'string');
}

function normalizePackagePath(path) {
  return path.replaceAll('\\', '/').replace(/^\.\//, '');
}

function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function isHttpUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
