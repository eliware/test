export default function validateRequiredStepInputs(steps, indexes) {
  const [checkout, setup, npmInstall, ci, test] = indexes;
  const errors = [];
  if (![26, "26"].includes(steps[setup]?.with?.["node-version"]))
    errors.push("ci.yaml setup-node must use Node.js 26.");
  const setupInputs = steps[setup]?.with ?? {};
  if (
    Object.keys(setupInputs).some((key) => !["node-version", "cache"].includes(key)) ||
    setupInputs.cache !== "npm"
  )
    errors.push("ci.yaml setup-node can use only node-version 26 and npm cache inputs.");
  const checkoutOptions = steps[checkout]?.with ?? {};
  if (
    ["repository", "ref", "sparse-checkout", "sparse-checkout-cone-mode"].some(
      (key) => checkoutOptions[key] !== undefined,
    )
  )
    errors.push("ci.yaml must not override the checkout repository, ref, or sparse scope.");
  for (const step of [steps[npmInstall], steps[ci], steps[test]])
    if (["env", "shell", "working-directory"].some((key) => Object.hasOwn(step ?? {}, key)))
      errors.push(
        "npm install, npm ci, and npm test steps must not override env, shell, or working-directory.",
      );
  return errors;
}
