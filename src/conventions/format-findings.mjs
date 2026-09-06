export function formatConventionFindings(findings) {
  const groups = new Map();
  for (const finding of findings) {
    const prefix = finding.severity === 'warning' ? 'warning: ' : '';
    if (!groups.has(finding.group)) groups.set(finding.group, new Set());
    groups.get(finding.group).add(`${prefix}${finding.message}`);
  }
  const lines = [findings.some(({ severity }) => severity !== 'warning') ? 'Repository convention validation failed:' : 'Repository convention validation warnings:'];
  for (const [group, messages] of [...groups.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    lines.push(`${group}:`);
    for (const message of [...messages].sort()) lines.push(`  - ${message}`);
  }
  return `${lines.join('\n')}\n`;
}
