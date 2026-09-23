import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const checksRoot = join(dirname(fileURLToPath(import.meta.url)), "../checks");
export const bundledConventionVersion = "8.0";

function profilesFromDirectories(root, listDirectories) {
  return listDirectories(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function authorityFromDirectories(names) {
  return {
    version: bundledConventionVersion,
    profiles: Object.fromEntries(names.map((name) => [name, { profile: name }])),
  };
}

// Consumers explicitly declare every applicable profile. The check-directory
// tree is the only authority for the available profile names.
export const bundledDirectiveAuthority = authorityFromDirectories(
  profilesFromDirectories(checksRoot, readdirSync),
);

export function readBundledProfileAuthority({ root = checksRoot, listDirectories = readdirSync } = {}) {
  let names;
  try {
    names = profilesFromDirectories(root, listDirectories);
  } catch (error) {
    throw new Error(`Bundled convention profiles could not be discovered: ${error.message}`);
  }
  if (names.length === 0) throw new Error("Bundled convention profile directories cannot be empty.");
  return authorityFromDirectories(names);
}

export function validateAppliedProfiles(apply, authority = readBundledProfileAuthority()) {
  const selected = new Set(apply);
  const unknown = apply.filter((name) => !authority.profiles[name]);
  if (unknown.length > 0) return `Unknown convention group: ${unknown.join(", ")}.`;
  if (selected.has("fork") && selected.size !== 1) return "The fork convention group excludes all other convention groups.";
  return null;
}

export function expandAppliedProfiles(apply, authority = readBundledProfileAuthority()) {
  const seen = new Set();
  return apply.filter((name) => authority.profiles[name] && !seen.has(name) && seen.add(name));
}
