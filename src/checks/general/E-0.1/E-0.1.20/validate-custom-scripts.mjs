import { isProhibitedPublishCommand } from "../E-0.1.24/is-prohibited-publish-command.mjs";

export function validateCustomScripts(scripts, requiredScripts) {
  const failures = [];
  for (const [name, command] of Object.entries(scripts)) {
    if (Object.hasOwn(requiredScripts, name)) continue;
    if (typeof command !== "string" || !command.trim()) {
      failures.push(`package.json.scripts.${name} must be a nonempty command.`);
      continue;
    }
    if (isProhibitedPublishCommand(command)) {
      failures.push(`package.json.scripts.${name} must not publish npm packages or GHCR images.`);
    }
  }
  return failures;
}
