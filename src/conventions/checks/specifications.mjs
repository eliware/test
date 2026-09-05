function finding(message) { return { group: 'specifications', message }; }
export function checkSpecifications(specFiles, overview, outOfScope) {
  const findings = [];
  if (!specFiles.length) findings.push(finding('specs/: contains no Markdown documents'));
  if (!overview) findings.push(finding('specs/: missing a clear overview/index document'));
  if (overview && specFiles.some((file) => file !== overview && !overview.includes(file))) findings.push(finding('specs/: overview does not link to every specification document'));
  if (!outOfScope) findings.push(finding('specs/: missing an explicit out-of-scope document or section'));
  return findings;
}
