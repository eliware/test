export default function validateDeploymentTimeout(deployment, label) {
  return deployment?.timeoutMs === 300000 ? [] : [`${label} must set timeoutMs to 300000.`];
}
