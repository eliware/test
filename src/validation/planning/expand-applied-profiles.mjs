import { readBundledProfileCatalog } from "../check-discovery/read-bundled-profile-catalog.mjs";

export function expandAppliedProfiles(apply, catalog = readBundledProfileCatalog()) {
  const seen = new Set();
  return apply.filter((name) => catalog.profiles[name] && !seen.has(name) && seen.add(name));
}
