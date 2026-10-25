import { validateDeploymentCommand } from "./validate-deployment-command.mjs";

const commandPrefix = ["git pull", "npm ci", "npm test"];

export function validateCommandList(commands, index = 0, packageJson = {}) {
  const label = `.knit/deploy.yaml commands field ${index + 1}`;
  if (!Array.isArray(commands) || commands.some((command) => typeof command !== "string"))
    return [`${label} must be an array of strings.`];
  const errors = checkCommandPrefix(commands, label);
  commands.forEach((command, position) => {
    errors.push(...validateDeploymentCommand(command, label, position, packageJson));
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
