import { discoverChecks } from "./discover-checks.mjs";
import { bundledDirectiveAuthority, expandAppliedProfiles, readBundledProfileAuthority } from "./read-bundled-profile-authority.mjs";

export async function selectConventionChecks(conventions, availableChecks = null) {
  const authority = readBundledProfileAuthority();
  const profiles = expandAppliedProfiles(conventions.apply, authority);
  const allowed = new Set(profiles.flatMap((profile) => bundledDirectiveAuthority.profiles[profile] ?? []));
  const checks = availableChecks ?? await discoverChecks(profiles);
  if (availableChecks) return checks.filter(({ ruleId, enforcementMode }) => allowed.has(ruleId) && enforcementMode !== "non-deterministic");
  return checks.filter(({ enforcementMode }) => enforcementMode !== "non-deterministic");
}
