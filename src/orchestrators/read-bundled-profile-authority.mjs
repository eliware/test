import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const checksRoot = join(dirname(fileURLToPath(import.meta.url)), "../checks");
export const bundledConventionVersion = "8.0";
const profileParents = Object.freeze({
  general: [], application: ["general"], cli: ["application"], web: ["application"],
  discord: ["application"], "mcp-server": ["application"], library: ["general"],
  documentation: ["general"], workspace: ["general"], infrastructure: ["general"],
  "npm-published": ["general"], "ghcr-published": ["general"], private: ["general"], fork: [],
});
const profileManifest = {
  version: bundledConventionVersion,
  profiles: Object.fromEntries(Object.keys(profileParents).map((profile) => [profile, {
    profile, document: `${profile}.json`, version: bundledConventionVersion, extends: profileParents[profile],
  }])),
};
// Authority describes profile structure only. Directive IDs are derived from
// the discovered bundled modules so this registry cannot drift from code.
export const bundledDirectiveAuthority = profileManifest;

export function readBundledProfileAuthority({ root = checksRoot, manifest = profileManifest, listDirectories = readdirSync, statDirectory = statSync } = {}) {
  if (manifest?.version !== bundledConventionVersion || !manifest?.profiles || Array.isArray(manifest.profiles)) {
    throw new Error("Bundled convention profile manifest must be a v8 profile registry.");
  }
  const names = Object.keys(manifest.profiles);
  if (names.length === 0) throw new Error("Bundled convention profile manifest cannot be empty.");
  const profiles = {};
  for (const name of names) {
    const metadata = manifest.profiles[name];
    if (!metadata || metadata.profile !== name || metadata.document !== `${name}.json` || metadata.version !== bundledConventionVersion || !Array.isArray(metadata.extends) || new Set(metadata.extends).size !== metadata.extends.length || metadata.extends.includes(name)) {
      throw new Error(`Bundled convention profile metadata is inconsistent for ${name}.`);
    }
    for (const parent of metadata.extends) {
      if (!names.includes(parent)) throw new Error(`Bundled convention profile ${name} extends unknown profile ${parent}.`);
    }
    const profileDir = join(root, name);
    try {
      if (!statDirectory(profileDir).isDirectory()) throw new Error("not a directory");
    } catch (error) {
      throw new Error(`Bundled convention profile ${name} is missing or invalid: ${error.message}`);
    }
    profiles[name] = { ...metadata };
  }
  const directories = listDirectories(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const expected = [...names].sort();
  if (JSON.stringify(directories) !== JSON.stringify(expected)) {
    throw new Error("Bundled convention profile directories do not match the profile manifest.");
  }
  return { version: manifest.version, profiles };
}

export function validateAppliedProfiles(apply, authority = readBundledProfileAuthority()) {
  const selected = new Set(apply);
  const unknown = apply.filter((name) => !authority.profiles[name]);
  if (unknown.length > 0) return `Unknown convention group: ${unknown.join(", ")}.`;
  if (selected.has("fork") && selected.size !== 1) return "The fork convention group excludes all other convention groups.";
  return null;
}

export function expandAppliedProfiles(apply, authority = readBundledProfileAuthority()) {
  const expanded = [];
  const seen = new Set();
  const visit = (name) => {
    if (seen.has(name)) return;
    seen.add(name);
    for (const parent of authority.profiles[name]?.extends ?? []) visit(parent);
    expanded.push(name);
  };
  for (const name of apply) visit(name);
  return expanded;
}
