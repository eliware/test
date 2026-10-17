import { isProhibitedNpmOrGhcrPublishCommand } from "../../../shared/is/prohibited-npm-or-ghcr-publish-command.mjs";
import { validateNpmRunCommand } from "../../../shared/package-scripts/validate/npm-run-command.mjs";

const commandPrefix = ["git pull", "npm ci", "npm test"];

export function findCommandLists(value, lists = []) {
  if (Array.isArray(value)) value.forEach((item) => findCommandLists(item, lists));
  else if (value && typeof value === "object")
    for (const [key, item] of Object.entries(value)) {
      if (key === "commands") lists.push(item);
      findCommandLists(item, lists);
    }
  return lists;
}

export function validateCommandList(commands, index = 0, packageJson = {}) {
  const label = `.knit/deploy.yaml commands field ${index + 1}`;
  if (!Array.isArray(commands) || commands.some((command) => typeof command !== "string"))
    return [`${label} must be an array of strings.`];
  const errors = checkCommandPrefix(commands, label);
  commands.forEach((command, position) => {
    errors.push(...checkCommand(command, label, position, packageJson));
  });
  return errors;
}

function checkCommandPrefix(commands, label) {
  if (commands.length < commandPrefix.length)
    return [`${label} must contain the full required command prefix.`];
  return commandPrefix.every((command, position) => commands[position] === command)
    ? []
    : [`${label} must begin with ${commandPrefix.join(", ")}.`];
}

function checkCommand(command, label, position, packageJson) {
  const errors = [];
  if (isProhibitedNpmOrGhcrPublishCommand(command))
    errors.push(`${label} must not publish npm packages or GHCR images.`);
  if (position >= commandPrefix.length)
    errors.push(...validateNpmRunCommand(command, packageJson, `${label} command ${position + 1}`));
  return errors;
}
