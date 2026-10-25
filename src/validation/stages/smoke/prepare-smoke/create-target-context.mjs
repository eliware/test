export function createSmokeTargetContext(targetRoot, assertTargetIdentity, packageJson, env) {
  return {
    targetRoot,
    assertTargetIdentity,
    binNames: Object.keys(packageJson?.bin ?? {}),
    childEnv: { ...env },
  };
}
