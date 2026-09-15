import { discoverChecks } from "./discover-checks.mjs";
import { expandAppliedProfiles, readBundledProfileAuthority } from "./read-bundled-profile-authority.mjs";

export async function selectConventionChecks(conventions, availableChecks = null) {
  const authority = readBundledProfileAuthority();
  const profiles = expandAppliedProfiles(conventions.apply, authority);
  const checks = availableChecks ?? await discoverChecks(profiles);
  const profileChecks = availableChecks ? await discoverChecks(profiles) : checks;
  const allowed = new Set(profileChecks.map(({ ruleId }) => ruleId));
  return checks.filter(({ ruleId, enforcementMode }) => allowed.has(ruleId) && enforcementMode !== "non-deterministic");
}
