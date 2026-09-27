import { discoverChecks } from "./discover-checks.mjs";
import { readBundledProfileAuthority } from "./read-bundled-profile-authority.mjs";
import { expandAppliedProfiles } from "./expand-applied-profiles.mjs";
import { validateAppliedProfiles } from "./validate-applied-profiles.mjs";

export async function selectConventionChecks(conventions, availableChecks = null) {
  const authority = readBundledProfileAuthority();
  const failure = validateAppliedProfiles(conventions.apply, authority);
  if (failure) throw new Error(failure);
  const profiles = expandAppliedProfiles(conventions.apply, authority);
  if (availableChecks) {
    const allowedGroups = new Set(profiles);
    return availableChecks.filter(({ modulePath }) => allowedGroups.has(modulePath?.split("/")[0]));
  }
  return discoverChecks(profiles);
}
