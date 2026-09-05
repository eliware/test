const ENV_PATTERN = /process\.env\.([A-Z][A-Z0-9_]*)/g;
function finding(message) { return { group: 'environment', message }; }
export function checkEnvironmentExample(envExample, referencedSource = '') {
  const findings = [];
  const documented = new Set();
  for (const line of envExample.split(/\r?\n/)) {
    const assignment = line.match(/^\s*#?\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!assignment) continue;
    documented.add(assignment[1]);
    if (!line.trimStart().startsWith('#') && !assignment[2].trim()) findings.push(finding(`.env.example: required variable ${assignment[1]} needs a placeholder value`));
    if (!line.trimStart().startsWith('#') && /(?:token|secret|password|private|credential)/i.test(assignment[2])) findings.push(finding(`.env.example: ${assignment[1]} must not contain a credential-like value`));
    if (line.trimStart().startsWith('#') && !assignment[2].trim()) findings.push(finding(`.env.example: optional variable ${assignment[1]} needs an explicit default`));
  }
  for (const name of new Set([...referencedSource.matchAll(ENV_PATTERN)].map((match) => match[1]))) if (!documented.has(name)) findings.push(finding(`.env.example: missing documented environment variable ${name}`));
  return findings;
}
