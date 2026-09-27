import { readBundledProfileAuthority } from "./read-bundled-profile-authority.mjs";

export function validateAppliedProfiles(apply, authority = readBundledProfileAuthority()) {
  const selected = new Set(apply);
  const unknown = apply.filter((name) => !authority.profiles[name]);
  if (unknown.length > 0) return `Unknown convention group: ${unknown.join(", ")}.`;
  if (selected.has("fork") && selected.size !== 1)
    return "The fork convention group excludes all other convention groups.";
  return null;
}
