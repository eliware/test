import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const checksRoot = join(dirname(fileURLToPath(import.meta.url)), "../checks");
export const bundledConventionVersion = "8.0";
export const bundledDirectiveAuthority = { version: "8.0", profiles: {
  general: ["E-1","E-1.0","A-1.0.0","A-1.0.1","A-1.0.2","A-1.0.3","A-1.0.4","A-1.0.6","A-1.0.7","A-1.0.8","A-1.0.9","A-1.0.10","A-1.0.11","E-1.2","E-1.1","E-1.1.0","E-1.3","A-1.3.0","E-1.4","E-1.5","E-1.6","E-1.6.0","E-1.6.1","A-1.6.2","E-1.7","E-1.8","E-1.9","E-1.9.0","A-1.9.1","E-1.9.2","E-1.9.3","E-1.9.4","E-1.9.5","A-1.9.6","A-1.9.8","E-1.9.7","E-1.10","E-1.10.0","E-1.10.1","E-1.11","E-1.12","E-1.13","E-1.14","E-1.15","E-1.16","E-1.17","E-1.18","E-1.19","E-1.23","E-1.24","A-1.24.0","A-1.24.1","E-1.24.2","E-1.24.3","E-1.24.4","E-1.25","A-1.25.0","A-1.25.0.0","A-1.25.1","E-1.26","A-1.26.0","E-1.20","A-1.20.0","E-1.20.1","E-1.20.2","E-1.20.3","E-1.20.4","E-1.20.5","E-1.20.6","E-1.20.7","E-1.20.8","E-1.20.9","E-1.20.10","A-1.20.10.0","A-1.20.11","A-1.20.11.0","E-1.20.12","E-1.20.13","E-1.20.14","E-1.20.15","E-1.20.16","E-1.20.17","A-1.20.18","E-1.20.19","E-1.20.20","E-1.22","A-1.22.0","A-1.22.1"],
  application: ["E-1.130","A-1.130.0","A-1.130.0.1","A-1.130.1","E-1.130.2","A-1.130.2.0","A-1.130.3"],
  cli: ["E-1.60","A-1.60.0","A-1.60.0.1","E-1.60.1","A-1.60.2"],
  web: ["E-1.50","A-1.50.0","A-1.50.0.1","E-1.50.1","E-1.50.2","E-1.50.4","E-1.50.5","A-1.50.3"],
  discord: ["E-1.70","A-1.70.0","A-1.70.0.1","A-1.70.2"],
  "mcp-server": ["E-1.80","A-1.80.0","A-1.80.0.1","A-1.80.2"],
  library: ["E-1.40","A-1.40.0","A-1.40.0.1","A-1.40.1","A-1.40.3","A-1.40.5","E-1.40.2","E-1.40.4","E-1.40.6"],
  documentation: ["E-1.100","A-1.100.0","A-1.100.0.1","E-1.100.1","A-1.100.2","A-1.100.3"],
  workspace: ["E-1.110","A-1.110.0","A-1.110.0.1","A-1.110.0.2","A-1.110.0.3","A-1.110.1","A-1.110.2","A-1.110.3"],
  infrastructure: ["E-1.90","A-1.90.0","A-1.90.0.1","A-1.90.0.2","A-1.90.0.3","A-1.90.0.4","A-1.90.0.5","A-1.90.1","A-1.90.2","A-1.90.3"],
  "npm-published": ["E-1.140","E-1.140.0","E-1.140.1","A-1.140.2","A-1.140.3","A-1.140.4"],
  "ghcr-published": ["E-1.160","E-1.160.0","E-1.160.1","E-1.160.2","E-1.160.3","E-1.160.4","E-1.160.5","E-1.160.6","E-1.160.7","E-1.160.8","A-1.160.9"],
  private: ["E-1.150","E-1.150.0","A-1.150.1"],
  fork: ["E-1.120","E-1.120.0"],
} };
const profileParents = Object.freeze({
  general: [], application: ["general"], cli: ["application"], web: ["application"],
  discord: ["application"], "mcp-server": ["application"], library: ["general"],
  documentation: ["general"], workspace: ["general"], infrastructure: ["general"],
  "npm-published": ["general"], "ghcr-published": ["general"], private: ["general"], fork: [],
});
const profileManifest = {
  version: bundledConventionVersion,
  profiles: Object.fromEntries(Object.keys(bundledDirectiveAuthority.profiles).map((profile) => [profile, {
    profile, document: `${profile}.json`, version: bundledConventionVersion, extends: profileParents[profile],
  }])),
};

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
