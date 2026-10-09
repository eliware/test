export function hasDeploymentCommand(steps) {
  const pattern =
    /(?:^|[;&|]\s*)(?:kubectl|helm\s+(?:upgrade|install)|terraform\s+apply|ansible-playbook|flyctl\s+deploy|wrangler\s+deploy|docker\s+stack\s+deploy)\b/iu;
  return steps.some(
    (step) =>
      typeof step?.run === "string" &&
      step.run.split(/\r?\n/u).some((command) => pattern.test(command.trim())),
  );
}
