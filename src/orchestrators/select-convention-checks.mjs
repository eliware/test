import { discoverChecks } from "./discover-checks.mjs";
import { expandAppliedProfiles, readBundledProfileAuthority } from "./read-bundled-profile-authority.mjs";

export async function selectConventionChecks(conventions) {
  return discoverChecks(expandAppliedProfiles(conventions.apply, readBundledProfileAuthority()));
}
