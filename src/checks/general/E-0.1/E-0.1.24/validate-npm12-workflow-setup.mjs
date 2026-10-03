export const npm12InstallCommand = "npm install --global npm@12";
export const npm12VersionCheckCommand = `node -e 'const {execFileSync}=require("node:child_process");const v=execFileSync("npm",["--version"],{encoding:"utf8"}).trim();if(!/^\\d+\\.\\d+\\.\\d+$/.test(v)||Number(v.split(".")[0])<12)process.exit(1)'`;

export function validateNpm12WorkflowSetup(
  name,
  commands,
  installIndex,
  steps = [],
  { requireSetup = false, beforeCommand = "npm ci" } = {},
) {
  const hasNpmCi = commands.some(({ command }) => /^npm\s+ci$/iu.test(command));
  const installs = commands.filter(({ command }) => command === npm12InstallCommand);
  const checks = commands.filter(({ command }) => command === npm12VersionCheckCommand);
  if (!requireSetup && !hasNpmCi && installs.length === 0 && checks.length === 0) return null;
  const commandIndex = (entry) => {
    if (Number.isInteger(entry?.index)) return entry.index;
    if (entry?.step) return steps.indexOf(entry.step);
    return -1;
  };
  const setupNodeSteps = steps.filter((step) => step?.uses === "actions/setup-node@v7");
  const setupNodeIndex = steps.indexOf(setupNodeSteps[0]);
  const install = installs[0];
  const check = checks[0];
  const setupSteps = [install?.step, check?.step, setupNodeSteps[0]];
  const installPosition = install ? commandIndex(install) : -1;
  const checkPosition = check ? commandIndex(check) : -1;
  const unsafeSetup = setupSteps.some(
    (step) =>
      !step ||
      ["if", "continue-on-error", "env", "shell", "working-directory"].some((field) =>
        Object.hasOwn(step, field),
      ),
  );
  if (
    installs.length !== 1 ||
    checks.length !== 1 ||
    !install ||
    !check ||
    setupNodeSteps.length !== 1 ||
    ![26, "26"].includes(setupNodeSteps[0]?.with?.["node-version"]) ||
    unsafeSetup ||
    setupNodeIndex < 0 ||
    setupNodeIndex >= installPosition ||
    installPosition >= checkPosition ||
    checkPosition >= installIndex
  ) {
    return `${name} must install npm@12 globally and verify npm 12 or later after setup-node and before ${beforeCommand}.`;
  }
  return null;
}
