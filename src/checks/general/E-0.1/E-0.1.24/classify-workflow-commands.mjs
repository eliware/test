import { isProhibitedPublishCommand } from "./is-prohibited-publish-command.mjs";

const allowedValidationPattern = /^(?:npm\s+ci|npm\s+test)$/iu;
const allowedSetupPattern = /^(?:echo|printf|node\s+--version|npm\s+--version)\b/iu;

export function isValidationWorkflowJob(job, workflowRunSteps) {
  const commands = workflowRunSteps(job).map(({ command }) => command);
  return commands.some(
    (command, index) =>
      /^npm\s+ci$/iu.test(command) && /^npm\s+test$/iu.test(commands[index + 1] ?? ""),
  );
}

export function findUnsupportedCommands(commands, { allowPostTestValidation = false } = {}) {
  const testCommand = commands.find(({ command }) => /^npm\s+test$/iu.test(command));
  const testIndex = testCommand?.index ?? (testCommand ? commands.indexOf(testCommand) : -1);
  return commands
    .filter(({ command, index }, position) => {
      const value = command.trim();
      const commandIndex = index ?? position;
      if (isProhibitedPublishCommand(value)) return true;
      if (allowPostTestValidation && testIndex >= 0 && commandIndex > testIndex) return false;
      return !allowedValidationPattern.test(value) && !allowedSetupPattern.test(value);
    })
    .map(({ command }) => command);
}
