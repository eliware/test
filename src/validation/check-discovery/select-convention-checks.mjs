import { discoverChecks } from "./discover-checks.mjs";
import { readBundledProfileCatalog } from "./read-bundled-profile-catalog.mjs";
import { expandAppliedProfiles } from "../planning/expand-applied-profiles.mjs";
import { validateAppliedProfiles } from "../planning/validate-applied-profiles.mjs";

export async function selectConventionChecks(conventions, availableChecks = null) {
  const catalog = readBundledProfileCatalog();
  const failure = validateAppliedProfiles(conventions.apply, catalog);
  if (failure) throw new Error(failure);
  const profiles = expandAppliedProfiles(conventions.apply, catalog);
  const selected = new Set(profiles);
  const applicable = ({ modulePath, requiredProfiles = [] }) =>
    modulePath?.split("/")[0] === "shared"
      ? requiredProfiles.every((profile) => selected.has(profile))
      : selected.has(modulePath?.split("/")[0]);
  if (availableChecks) {
    return availableChecks.filter(applicable);
  }
  const checks = await discoverChecks([...profiles, "shared"]);
  return checks.filter(applicable);
}
