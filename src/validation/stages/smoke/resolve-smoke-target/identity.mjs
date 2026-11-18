import createSmokeTargetIdentityGuard from "./identity-guard.mjs";
export default async function inspectSmokeTargetIdentity(targetRoot, inspect) {
  let identity;
  try {
    identity = await inspect(targetRoot);
    if (!identity.isDirectory())
      return {
        error: "Smoke target must resolve to an existing directory.",
      };
  } catch {
    return {
      error: "Smoke target must resolve to an existing directory.",
    };
  }
  return {
    assertIdentity: createSmokeTargetIdentityGuard(targetRoot, identity, inspect),
  };
}
