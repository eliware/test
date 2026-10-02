export function hasAdjacentValidationSteps(install, test, steps, commands) {
  const allSteps = Array.isArray(steps) ? steps : [];
  const installIndex = install.step ? allSteps.indexOf(install.step) : commands.indexOf(install);
  const testIndex = test.step ? allSteps.indexOf(test.step) : commands.indexOf(test);
  // codescope ignore: Compare positions in the complete original step list so actions between npm ci and npm test cannot be skipped.
  return installIndex >= 0 && testIndex === installIndex + 1;
}
