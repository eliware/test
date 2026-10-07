import { discoverChecks } from "./discover-checks.mjs";
import { readBundledProfileCatalog } from "./read-bundled-profile-catalog.mjs";
import { expandAppliedProfiles } from "../planning/expand-applied-profiles.mjs";
import { validateAppliedProfiles } from "../planning/validate-applied-profiles.mjs";

export async function selectConventionChecks(conventions, availableChecks = null) {
  const catalog = readBundledProfileCatalog();
  const failure = validateAppliedProfiles(conventions.apply, catalog);
  if (failure) throw new Error(failure);
  const profiles = expandAppliedProfiles(conventions.apply, catalog);
  if (availableChecks) {
    const allowedGroups = new Set(profiles);
    return availableChecks.filter(({ modulePath }) => allowedGroups.has(modulePath?.split("/")[0]));
  }
  return discoverChecks(profiles);
}
