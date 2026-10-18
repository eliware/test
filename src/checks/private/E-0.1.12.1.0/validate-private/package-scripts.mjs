import { isNpmPublishCommand } from "../../../shared/is/npm-publish-command.mjs";

const tokenNames = ["NPM_TOKEN", "NODE_AUTH_TOKEN"];

export function validatePrivatePackageScripts(packageJson = {}) {
  const scripts = packageJson?.scripts ?? {};
  if (!scripts || typeof scripts !== "object" || Array.isArray(scripts)) return [];
  return Object.entries(scripts).flatMap(([name, command]) => {
    if (typeof command !== "string") return [];
    const errors = [];
    if (isNpmPublishCommand(command))
      errors.push(`package.json.scripts.${name} must not run an npm publication command.`);
    if (tokenNames.some((token) => hasTokenSetting(command, token)))
      errors.push(`package.json.scripts.${name} must not set or reference npm publication tokens.`);
    return errors;
  });
}

function hasTokenSetting(command, token) {
  return new RegExp(
    `(?:^|[\\s;,.])(?:export\\s+|set\\s+)?${token}\\s*=|\\$\\{${token}\\b[^}]*\\}|\\$${token}\\b|\\$\\{\\{\\s*secrets\\.${token}\\s*\\}\\}`,
    "iu",
  ).test(command);
}
