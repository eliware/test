export const npmLatestInstallCommand = "npm -g install npm@latest";

export function validateNpmInstallWorkflowSetup(
  name,
  commands,
  installIndex,
  steps = [],
  { requireSetup = false, beforeCommand = "npm ci" } = {},
) {
  const hasNpmCi = commands.some(({ command }) => /^npm\s+ci$/iu.test(command));
  const installs = commands.filter(({ command }) => command === npmLatestInstallCommand);
  if (!requireSetup && !hasNpmCi && installs.length === 0) return null;
  const commandIndex = (entry) => {
    if (Number.isInteger(entry?.index)) return entry.index;
    if (entry?.step) return steps.indexOf(entry.step);
    return -1;
  };
  const setupNodeSteps = steps.filter((step) => /^actions\/setup-node@/iu.test(step?.uses ?? ""));
  const setupNodeIndex = steps.indexOf(setupNodeSteps[0]);
  const install = installs[0];
  const installPosition = commandIndex(install);
  const unsafeSetup = [install?.step, ...setupNodeSteps].some(
    (step) =>
      !step ||
      ["if", "continue-on-error", "continueOnError", "env", "shell", "working-directory"].some(
        (field) => Object.hasOwn(step, field),
      ),
  );
  if (
    installs.length !== 1 ||
    !install ||
    setupNodeSteps.length !== 1 ||
    !/^actions\/setup-node@v7(?:\.|$)/iu.test(setupNodeSteps[0].uses) ||
    ![26, "26"].includes(setupNodeSteps[0]?.with?.["node-version"]) ||
    unsafeSetup ||
    setupNodeIndex < 0 ||
    setupNodeIndex >= installPosition ||
    installPosition >= installIndex
  ) {
    return `${name} must run npm -g install npm@latest after setup-node and before ${beforeCommand}.`;
  }
  return null;
}
