function finding(message) { return { group: 'agents', message }; }
export function checkAgents(agents, exceptions = []) {
  const findings = [];
  if (!/^\s*Applies to\s*:/im.test(agents)) findings.push(finding('AGENTS.md: must declare instruction scope with an "Applies to:" marker'));
  if (exceptions.length && !/intentional deviations?|exceptions?/i.test(agents)) findings.push(finding('AGENTS.md: must document an intentional deviations section when exceptions are configured'));
  return findings;
}
