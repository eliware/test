import { discoverChecks } from "./discover-checks.mjs";
import { expandAppliedProfiles, readBundledProfileAuthority } from "./read-bundled-profile-authority.mjs";

export async function selectConventionChecks(conventions) {
  const checks = await discoverChecks(expandAppliedProfiles(conventions.apply, readBundledProfileAuthority()));
  return checks.filter(({ enforcementMode }) => enforcementMode !== "non-deterministic");
}
