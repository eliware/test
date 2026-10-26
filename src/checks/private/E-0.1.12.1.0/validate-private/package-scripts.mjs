import { isNpmPublishCommand } from "../../../shared/is/npm-publish-command.mjs";
import { hasNpmPublicationTokenSetting } from "./token-settings.mjs";

export function validatePrivatePackageScripts(packageJson = {}) {
  const scripts = packageJson?.scripts ?? {};
  if (!scripts || typeof scripts !== "object" || Array.isArray(scripts)) return [];
  return Object.entries(scripts).flatMap(([name, command]) => {
    if (typeof command !== "string") return [];
    const errors = [];
    if (isNpmPublishCommand(command))
      errors.push(`package.json.scripts.${name} must not run an npm publication command.`);
    if (hasNpmPublicationTokenSetting(command))
      errors.push(`package.json.scripts.${name} must not set or reference npm publication tokens.`);
    return errors;
  });
}
