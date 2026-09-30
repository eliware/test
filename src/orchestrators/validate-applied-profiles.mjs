import { readBundledProfileCatalog } from "./read-bundled-profile-catalog.mjs";

export function validateAppliedProfiles(apply, catalog = readBundledProfileCatalog()) {
  const unknown = apply.filter((name) => !catalog.profiles[name]);
  if (unknown.length > 0) return `Unknown convention group: ${unknown.join(", ")}.`;
  return null;
}
