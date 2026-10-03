const setupNodeInputs = new Map([
  ["node-version", [26, "26"]],
  ["cache", ["npm"]],
  ["registry-url", ["https://registry.npmjs.org"]],
  ["package-manager-cache", [false]],
]);

export function isSupportedWorkflowAction(step) {
  if (!step || step.uses === undefined) return true;
  if (typeof step.uses !== "string") return false;
  if (/^actions\/checkout@v6(?:\.|$)/iu.test(step.uses))
    return step.with === undefined || isEmptyObject(step.with);
  if (!/^actions\/setup-node@v7(?:\.|$)/iu.test(step.uses)) return false;
  if (!step.with || typeof step.with !== "object" || Array.isArray(step.with)) return false;
  if (![26, "26"].includes(step.with["node-version"])) return false;
  return Object.entries(step.with).every(([key, value]) =>
    setupNodeInputs.get(key)?.includes(value),
  );
}

function isEmptyObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !Object.keys(value).length
  );
}
