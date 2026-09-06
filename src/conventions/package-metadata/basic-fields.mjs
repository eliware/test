function finding(message) { return { group: 'package', message }; }
function isHttpUrl(value) { try { const url = new URL(String(value)); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; } }

/** Validate basic package metadata types and URL shapes. */
export function checkBasicPackageFields(packageJson) {
  const findings = [];
  for (const field of ['name', 'version', 'description', 'author', 'license']) if (typeof packageJson[field] !== 'string' || packageJson[field].trim() === '') findings.push(finding(`package.json: ${field} must be a non-empty string`));
  if (!Array.isArray(packageJson.keywords) || packageJson.keywords.length === 0 || packageJson.keywords.some((item) => typeof item !== 'string' || item.trim() === '')) findings.push(finding('package.json: keywords must be a non-empty string array'));
  for (const field of ['repository', 'bugs', 'homepage']) { const value = typeof packageJson[field] === 'string' ? packageJson[field] : packageJson[field]?.url; if (value !== undefined && !isHttpUrl(value)) findings.push(finding(`package.json: ${field} URL must be a valid http:// or https:// URL`)); }
  if (packageJson.engines !== undefined && (typeof packageJson.engines !== 'object' || typeof packageJson.engines.node !== 'string' || packageJson.engines.node.trim() === '')) findings.push(finding('package.json: engines.node must be a non-empty string when present'));
  return findings;
}
