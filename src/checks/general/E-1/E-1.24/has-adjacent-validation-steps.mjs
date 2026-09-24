export function hasAdjacentValidationSteps(install, test, steps, commands) {
  const allSteps = Array.isArray(steps) ? steps : [];
  const installIndex = install.step ? allSteps.indexOf(install.step) : commands.indexOf(install);
  const testIndex = test.step ? allSteps.indexOf(test.step) : commands.indexOf(test);
  return installIndex >= 0 && testIndex === installIndex + 1;
}
