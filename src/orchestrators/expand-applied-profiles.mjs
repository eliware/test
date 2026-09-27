import { readBundledProfileAuthority } from "./read-bundled-profile-authority.mjs";

export function expandAppliedProfiles(apply, authority = readBundledProfileAuthority()) {
  const seen = new Set();
  return apply.filter((name) => authority.profiles[name] && !seen.has(name) && seen.add(name));
}
