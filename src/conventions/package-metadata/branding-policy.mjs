export function checkEliwareBranding(packageJson, finding) {
  if (packageJson.private === true || typeof packageJson.name !== 'string' || !packageJson.name.startsWith('@eliware/')) return [];
  return /^eliware(?:\s|$)/i.test(packageJson.author ?? '')
    ? []
    : [finding('package.json: public @eliware packages must identify Eliware as the author')];
}

