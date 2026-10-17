const packagePublishCommand =
  /^(?:npm\s+publish|pnpm\s+publish|yarn\s+(?:npm\s+)?publish|bun\s+publish)(?:\s|$)/iu;
const publishingAction = /(?:npm-publish|publish-npm|action-publish|changesets\/action)(?:@|$)/iu;

export function hasAlternateNpmPublisher(steps) {
  return steps.some((step) => {
    if (typeof step?.uses === "string" && publishingAction.test(step.uses)) return true;
    if (typeof step?.run !== "string" || step.run === "npm publish --provenance") return false;
    return step.run.split(/\r?\n|&&|\|\||[;|]/u).some((command) => isPublishCommand(command));
  });
}

function isPublishCommand(command) {
  let value = command.trim();
  if (!value || /^(?:echo|printf)\s/iu.test(value)) return false;
  const shellWrapper = value.match(/^(?:sh|bash|zsh)\s+(?:-l\s+)?-c\s+(["'])([\s\S]*)\1$/iu);
  if (shellWrapper) value = shellWrapper[2].trim();
  value = value.replace(/^(?:(?:sudo|npx|corepack|command|exec)\s+)+/iu, "");
  value = value.replace(/^env\s+(?:[A-Za-z_][\w]*=\S+\s+)*(?=[A-Za-z])/u, "");
  return packagePublishCommand.test(value);
}
