const safeReportingCommand = /^(?:echo|printf)(?:\s+(?:"[^"`$;&|<>]*"|'[^'`;|&<>]*'|[\w./:@=-]+))*$/u;
const safeEnvironmentSetup = /^printf\s+'[A-Z_][A-Z0-9_]*=[A-Za-z0-9_@.\\-]*\\n'\s+>\s+\.env$/u;

export function validateWorkflowSequence(name, commands, steps = commands, job = {}) {
  const installs = commands.filter(({ command }) => /^npm\s+ci$/iu.test(command));
  const tests = commands.filter(({ command }) => /^npm\s+test$/iu.test(command));
  const install = installs[0];
  const test = tests[0];
  const commandIndex = (entry) => Number.isInteger(entry?.index) ? entry.index : commands.indexOf(entry);
  if (installs.length !== 1 || tests.length !== 1 || !install || !test || commandIndex(install) >= commandIndex(test))
    return `${name} must validate with exactly one npm ci followed immediately by npm test.`;

  const allSteps = Array.isArray(steps) ? steps : [];
  const installStepIndex = install.step ? allSteps.indexOf(install.step) : commands.indexOf(install);
  const testStepIndex = test.step ? allSteps.indexOf(test.step) : commands.indexOf(test);
  if (installStepIndex < 0 || testStepIndex !== installStepIndex + 1)
    return `${name} must run npm ci immediately followed by npm test with no intervening steps.`;
  if (job.if !== undefined || job["continue-on-error"] === true || job.continueOnError === true)
    return `${name} must not conditionally skip or ignore failure of its validation job.`;
  if ([install, test].some(({ step }) => step?.if !== undefined || step?.["continue-on-error"] === true || step?.continueOnError === true))
    return `${name} must not conditionally skip or ignore failure of npm ci or npm test.`;
  if (commands.some(({ command }, index) => index < commandIndex(install) && !safeReportingCommand.test(command) && !safeEnvironmentSetup.test(command)))
    return `${name} may only run safe setup or reporting commands before npm ci.`;
  if (commands.some(({ command }, index) => index > commandIndex(test) && !safeReportingCommand.test(command)))
    return `${name} may only run reporting commands after npm test.`;
  return null;
}
