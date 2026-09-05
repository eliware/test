export function checkEliwareRepository(packageJson, finding) {
  if (packageJson.private === true || typeof packageJson.name !== 'string' || !packageJson.name.startsWith('@eliware/')) return [];
  const repository = typeof packageJson.repository === 'string' ? packageJson.repository : packageJson.repository?.url;
  const expected = `https://github.com/eliware/${packageJson.name.slice('@eliware/'.length)}`;
  const normalized = typeof repository === 'string' ? repository.replace(/\.git$/, '').replace(/\/$/, '') : '';
  return normalized === expected
    ? []
    : [finding(`package.json: public @eliware packages must use canonical repository ${expected}`)];
}

