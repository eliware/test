import {
  npmLatestInstallCommand,
  validateNpmInstallWorkflowSetup,
} from "../general/E-0.1/E-0.1.24/validate-npm-install-workflow-setup.mjs";

export function validateNpmToolchainForPublication(name, job) {
  const steps = Array.isArray(job?.steps) ? job.steps : [];
  const commands = steps.flatMap((step, index) =>
    typeof step?.run === "string" ? [{ command: step.run.trim(), step, index }] : [],
  );
  const invokesNpm = commands.filter(({ command }) => /^npm(?:\s|$)/iu.test(command));
  if (invokesNpm.length === 0) return null;
  const npmOperation = invokesNpm.find(({ command }) => command !== npmLatestInstallCommand);
  const beforeIndex = npmOperation?.index ?? steps.length;
  return validateNpmInstallWorkflowSetup(name, commands, beforeIndex, steps, {
    requireSetup: true,
    beforeCommand: "its first npm operation",
  });
}
