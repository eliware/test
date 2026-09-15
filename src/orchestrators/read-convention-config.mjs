import { expandAppliedProfiles, readBundledProfileAuthority, validateAppliedProfiles } from "./read-bundled-profile-authority.mjs";

export function readConventionConfig(packageJson) {
  const apply = packageJson?.eliware?.apply;
  if (!Array.isArray(apply) || apply.length === 0) {
    throw new Error("package.json must define eliware.apply.");
  }
  if (apply.some((group) => typeof group !== "string" || group.length === 0)) {
    throw new Error("eliware.apply must be an array of group names.");
  }
  const authority = readBundledProfileAuthority();
  const failure = validateAppliedProfiles(apply, authority);
  if (failure) throw new Error(failure);
  return { apply: expandAppliedProfiles(apply, authority) };
}
