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
  const value = command.trim();
  if (!value || /^(?:echo|printf)\s/iu.test(value)) return false;
  const shellWrapper = value.match(/^(?:sh|bash|zsh)\s+(?:-l\s+)?-c\s+(["'])([\s\S]*)\1$/iu);
  if (shellWrapper) return isPublishCommand(shellWrapper[2]);
  const npmExec = value.match(/^npm\s+exec\b(.*)$/iu);
  if (npmExec) return isPublishCommand(unwrapNpmExec(npmExec[1]));
  const wrapped = value
    .replace(/^(?:(?:sudo|npx|corepack|command|exec)\s+)+/iu, "")
    .replace(/^env\s+(?:[A-Za-z_][\w]*=\S+\s+)*(?=[A-Za-z])/u, "");
  return wrapped !== value ? isPublishCommand(wrapped) : packagePublishCommand.test(value);
}

function unwrapNpmExec(argumentsText) {
  return argumentsText.trim().replace(/^(?:(?:--[\w-]+(?:=\S+)?|--)\s+)*/u, "");
}
