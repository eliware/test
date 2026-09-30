import { readBundledProfileCatalog } from "./read-bundled-profile-catalog.mjs";
import { expandAppliedProfiles } from "./expand-applied-profiles.mjs";
import { validateAppliedProfiles } from "./validate-applied-profiles.mjs";

export function readConventionConfig(packageJson) {
  const apply = packageJson?.eliware?.apply;
  if (!Array.isArray(apply) || apply.length === 0) {
    throw new Error("package.json must define eliware.apply.");
  }
  if (apply.some((group) => typeof group !== "string" || group.length === 0)) {
    throw new Error("eliware.apply must be an array of group names.");
  }
  const catalog = readBundledProfileCatalog();
  const failure = validateAppliedProfiles(apply, catalog);
  if (failure) throw new Error(failure);
  return { apply: expandAppliedProfiles(apply, catalog) };
}
