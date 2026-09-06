function finding(message) { return { group: 'package', message }; }
function normalizePackagePath(path) { return path.replaceAll('\\', '/').replace(/^\.\//, ''); }
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function normalizeBinEntries(bin) { if (typeof bin === 'string') return [['default', bin]]; if (!bin || typeof bin !== 'object' || Array.isArray(bin)) return []; return Object.entries(bin).filter(([, target]) => typeof target === 'string'); }
export function checkPackageConsistency(packageJson, { readme = '', licenseText = '', releaseNotes = '', existingPaths = new Set(), existingFiles = existingPaths } = {}) {
  const findings = [];
  for (const [name, target] of normalizeBinEntries(packageJson.bin)) { const normalizedTarget = normalizePackagePath(target); if (!normalizedTarget || !existingFiles.has(normalizedTarget)) findings.push(finding(`package.json: bin.${name} target does not exist: ${target}`)); }
  if (packageJson.name && !readme.includes(packageJson.name)) findings.push(finding(`README.md: does not mention package name ${packageJson.name}`));
  if (packageJson.version && !new RegExp(`^##\\s+v?${escapeRegExp(packageJson.version)}(?:\\s|$)`, 'mi').test(releaseNotes)) findings.push(finding(`RELEASE_NOTES.md: missing heading for version ${packageJson.version}`));
  if (packageJson.license && ![...existingPaths].some((path) => path.toLowerCase() === packageJson.license.toLowerCase() || path.toLowerCase() === 'license')) findings.push(finding(`package.json: license ${packageJson.license} has no corresponding license file`));
  if (packageJson.private !== true && typeof packageJson.name === 'string' && packageJson.name.startsWith('@eliware/')) {
    for (const required of ['docs', 'specs']) if (!packageJson.files?.some((entry) => entry === required || entry === `${required}/` || entry.startsWith(`${required}/`))) findings.push(finding(`package.json: public Eliware packages must publish ${required}/`));
    if (packageJson.description && !readme.replace(/\s+/g, ' ').toLowerCase().includes(packageJson.description.replace(/\s+/g, ' ').toLowerCase())) findings.push(finding('README.md: public package description does not match package.json description'));
    const author = typeof packageJson.author === 'string' ? packageJson.author : packageJson.author?.name;
    if (author) {
      for (const [label, text] of [['README.md', readme], ['LICENSE', licenseText]]) {
        const attributionLines = text.split(/\r?\n/).filter((line) => /©|copyright\s*\(c\)|copyright\s+(?:19|20)\d{2}|\bauthor\b/i.test(line));
        if (attributionLines.length && !attributionLines.every((line) => line.toLowerCase().includes('eliware'))) findings.push(finding(`${label}: attribution must identify Eliware`));
        if (attributionLines.some((line) => /(?:19|20)\d{2}/.test(line) && !line.includes(String(new Date().getFullYear())))) findings.push(finding(`${label}: attribution year must match the current release year`));
      }
    }
  }
  for (const entry of packageJson.files ?? []) { if (typeof entry !== 'string') continue; const normalized = entry.replace(/\/$/, ''); const pattern = entry.includes('*') ? new RegExp(`^${escapeRegExp(normalized).replaceAll('\\*', '.*')}(?:/|$)`) : null; const exists = pattern ? [...existingPaths].some((path) => pattern.test(path)) : entry.endsWith('/') ? [...existingPaths].some((path) => path.startsWith(`${normalized}/`)) || existingPaths.has(normalized) : existingPaths.has(normalized); if (!exists) findings.push(finding(`package.json: files entry does not exist: ${entry}`)); }
  return findings;
}
