export function hasDeploymentCommand(steps) {
  const pattern =
    /^(?:kubectl\b|helm\s+(?:upgrade|install)\b|terraform\s+apply\b|ansible-playbook\b|flyctl\s+deploy\b|wrangler\s+deploy\b|docker\s+stack\s+deploy\b)/iu;
  return steps.some(
    (step) =>
      typeof step?.run === "string" &&
      step.run.split(/\r?\n|[;&|]+/u).some((command) => pattern.test(command.trim())),
  );
}
