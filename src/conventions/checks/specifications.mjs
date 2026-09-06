import { hasDirectLink } from './documentation-links.mjs';
function finding(message) { return { group: 'specifications', message }; }
export function checkSpecifications(specFiles, overview) {
  const findings = [];
  if (!specFiles.length) findings.push(finding('specs/: contains no Markdown documents'));
  if (!overview) findings.push(finding('specs/: missing a clear overview/index document'));
  if (overview && specFiles.some((file) => !['README.md', 'index.md'].includes(file.toLowerCase()) && !hasDirectLink(overview, file, 'specs'))) findings.push(finding('specs/: overview does not link to every specification document'));
  return findings;
}
