const npmRunCommand = /^npm run ([a-z0-9:_-]+)(?: --(?: .*)?)?$/iu;

export function validateNpmRunCommand(command, packageJson, label) {
  const match = command.match(npmRunCommand);
  if (!match) return [`${label} must call a declared package script with npm run <name>.`];
  const scripts = packageJson?.scripts;
  if (!scripts || typeof scripts !== "object" || !Object.hasOwn(scripts, match[1]))
    return [`${label} must name a script declared in package.json.scripts.`];
  return [];
}
