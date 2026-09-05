export function formatConventionFindings(findings) {
  const groups = new Map();
  for (const finding of findings) {
    if (!groups.has(finding.group)) groups.set(finding.group, new Set());
    groups.get(finding.group).add(finding.message);
  }
  const lines = ['Repository convention validation failed:'];
  for (const [group, messages] of [...groups.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    lines.push(`${group}:`);
    for (const message of [...messages].sort()) lines.push(`  - ${message}`);
  }
  return `${lines.join('\n')}\n`;
}
