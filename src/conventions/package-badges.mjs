function finding(message) { return { group: 'readme', message }; }

export function checkPublicBadges(readme, packageName, repository) {
  if (typeof packageName !== 'string' || !packageName.startsWith('@eliware/')) return [];
  const repositoryUrl = typeof repository === 'string' ? repository : repository?.url;
  const ciBase = typeof repositoryUrl === 'string' ? repositoryUrl.replace(/\.git$/, '').replace(/\/$/, '') : '';
  const required = [`https://www.npmjs.com/package/${packageName}`, '(LICENSE)', `${ciBase}/actions/workflows/nodejs.yml`];
  return required.filter((target) => !readme.includes(target)).map((target) => finding(`README.md: missing public badge link ${target}`));
}
