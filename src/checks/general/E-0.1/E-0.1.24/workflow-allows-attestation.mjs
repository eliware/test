export function workflowAllowsAttestation(packageJson) {
  return (
    Array.isArray(packageJson?.eliware?.apply) &&
    packageJson.eliware.apply.includes("ghcr-published")
  );
}
