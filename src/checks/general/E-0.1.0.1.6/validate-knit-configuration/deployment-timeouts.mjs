export function validateDeploymentTimeouts(document) {
  const errors = [];
  const deployments = document?.on?.push?.deployments;
  if (!Array.isArray(deployments) || deployments.length === 0)
    errors.push(".knit/deploy.yaml must define push deployments.");
  else checkTimeouts(deployments, ".knit/deploy.yaml deployment", errors);
  const tagActions = document?.on?.tags;
  if (tagActions && typeof tagActions === "object")
    for (const [tag, action] of Object.entries(tagActions))
      if (Array.isArray(action?.deployments))
        checkTimeouts(action.deployments, `.knit/deploy.yaml tag ${tag} deployment`, errors);
  return errors;
}

function checkTimeouts(deployments, label, errors) {
  deployments.forEach((deployment, index) => {
    if (deployment?.timeoutMs !== 300000)
      errors.push(`${label} ${index + 1} must set timeoutMs to 300000.`);
  });
}
