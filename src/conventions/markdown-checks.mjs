const LINK_PATTERN = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g;
const HEADING_ALIASES = Object.freeze({
  purpose: ['purpose', 'about', 'introduction', 'overview'], requirements: ['requirements', 'prerequisites'],
  installation: ['installation', 'install', 'setup'], usage: ['usage', 'commands', 'api'], configuration: ['configuration', 'config'],
  validation: ['validation', 'development', 'testing'], security: ['security'], support: ['support', 'help'], license: ['license']
});

function finding(group, message) { return { group, message }; }

export function checkReadme(readme, existingPaths, packageFiles = [], packageJson = {}) {
  const findings = [];
  if (packageJson.private !== true && typeof packageJson.name === 'string' && packageJson.name.startsWith('@eliware/')) {
    const opening = readme.split(/\r?\n/).slice(0, 3).join('\n');
    if (!opening.includes('https://eliware.org/logos/brand.png') || !opening.includes('https://discord.gg/M6aTR9eTwN')) {
      findings.push(finding('readme', 'README.md: public Eliware packages must use the standard branded opening'));
    }
  }
  const headings = [...readme.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1].trim().toLowerCase());
  const introductoryText = readme.replace(/^#.*$/gm, '').trim();
  for (const [name, aliases] of Object.entries(HEADING_ALIASES)) {
    const present = aliases.some((alias) => headings.some((heading) => heading === alias || heading.startsWith(`${alias} `)));
    if (name === 'purpose' && introductoryText) continue;
    if (name === 'configuration' && !/eliwareTest|--workers|configuration/i.test(readme)) continue;
    if (!present) findings.push(finding('readme', `README.md: missing ${name} section`));
  }
  for (const match of readme.matchAll(LINK_PATTERN)) {
    const link = match[1].replace(/[?#].*$/, '');
    if (!link || /^(?:https?:|mailto:|#)/.test(link)) continue;
    if (link === 'spec/' || link.startsWith('spec/')) findings.push(finding('readme', `README.md: references removed path ${link}`));
    const target = link.replace(/^\.\//, '').replace(/\/$/, '');
    if (!existingPaths.has(target) && !existingPaths.has(`${target}.md`)) findings.push(finding('readme', `README.md: relative link does not resolve: ${link}`));
  }
  for (const required of ['README.md', 'LICENSE', 'RELEASE_NOTES.md']) if (packageFiles.length && !packageFiles.includes(required)) findings.push(finding('package', `package.json: files must include ${required}`));
  return findings;
}

export function checkSpecifications(specFiles, overview, outOfScope) {
  const findings = [];
  if (!specFiles.length) findings.push(finding('specifications', 'specs/: contains no Markdown documents'));
  if (!overview) findings.push(finding('specifications', 'specs/: missing a clear overview/index document'));
  if (overview && specFiles.some((file) => file !== overview && !overview.includes(file))) findings.push(finding('specifications', 'specs/: overview does not link to every specification document'));
  if (!outOfScope) findings.push(finding('specifications', 'specs/: missing an explicit out-of-scope document or section'));
  return findings;
}

export function checkAgents(agents, exceptions = []) {
  const findings = [];
  if (!/^\s*Applies to\s*:/im.test(agents)) findings.push(finding('agents', 'AGENTS.md: must declare instruction scope with an "Applies to:" marker'));
  if (exceptions.length && !/intentional deviations?|exceptions?/i.test(agents)) findings.push(finding('agents', 'AGENTS.md: must document an intentional deviations section when exceptions are configured'));
  return findings;
}
