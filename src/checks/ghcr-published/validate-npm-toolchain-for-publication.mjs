import {
  npm12InstallCommand,
  validateNpm12WorkflowSetup,
} from "../general/E-0.1/E-0.1.24/validate-npm12-workflow-setup.mjs";

export function validateNpmToolchainForPublication(name, job) {
  const steps = Array.isArray(job?.steps) ? job.steps : [];
  const commands = steps.flatMap((step, index) =>
    typeof step?.run === "string" ? [{ command: step.run.trim(), step, index }] : [],
  );
  const invokesNpm = commands.filter(({ command }) => /^npm(?:\s|$)/iu.test(command));
  if (invokesNpm.length === 0) return null;
  const npmOperation = invokesNpm.find(({ command }) => command !== npm12InstallCommand);
  const beforeIndex = npmOperation?.index ?? steps.length;
  return validateNpm12WorkflowSetup(name, commands, beforeIndex, steps, {
    requireSetup: true,
    beforeCommand: "its first npm command",
  });
}
