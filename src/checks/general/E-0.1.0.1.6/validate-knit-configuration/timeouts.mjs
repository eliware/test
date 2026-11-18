import validateDeploymentTimeout from "./deployment-timeouts.mjs";
export default function validateDeploymentTimeouts(document) {
  const errors = [];
  const deployments = document?.on?.push?.deployments;
  if (deployments !== undefined) {
    if (!Array.isArray(deployments))
      errors.push(".knit/deploy.yaml push deployments must be an array.");
    else checkTimeouts(deployments, ".knit/deploy.yaml deployment", errors);
  }
  const tagActions = document?.on?.tags;
  if (tagActions && typeof tagActions === "object")
    for (const [tag, action] of Object.entries(tagActions)) {
      if (!action || typeof action !== "object" || !Object.hasOwn(action, "deployments")) continue;
      if (!Array.isArray(action.deployments)) {
        errors.push(`.knit/deploy.yaml tag ${tag} deployments must be an array.`);
        continue;
      }
      checkTimeouts(action.deployments, `.knit/deploy.yaml tag ${tag} deployment`, errors);
    }
  return errors;
}
function checkTimeouts(deployments, label, errors) {
  deployments.forEach((deployment, index) => {
    errors.push(...validateDeploymentTimeout(deployment, `${label} ${index + 1}`));
  });
}
