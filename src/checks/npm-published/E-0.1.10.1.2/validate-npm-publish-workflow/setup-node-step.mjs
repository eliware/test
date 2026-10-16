export function isValidNpmSetupNodeStep(step) {
  const input = step?.with;
  return (
    step?.uses === "actions/setup-node@v7" &&
    [26, "26"].includes(input?.["node-version"]) &&
    input?.["registry-url"] === "https://registry.npmjs.org" &&
    input?.["package-manager-cache"] === false &&
    Object.keys(input).length === 3 &&
    isUnconditional(step)
  );
}

function isUnconditional(step) {
  return step && step.if === undefined && step["continue-on-error"] === undefined;
}
