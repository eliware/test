export function checkEliwareBranding(packageJson, finding) {
  if (packageJson.private === true || typeof packageJson.name !== 'string' || !packageJson.name.startsWith('@eliware/')) return [];
  return packageJson.author === 'Eliware <eliware@eliware.org>'
    ? []
    : [finding('package.json: public @eliware packages must use author Eliware <eliware@eliware.org>')];
}
