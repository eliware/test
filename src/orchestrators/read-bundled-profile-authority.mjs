import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const checksRoot = join(dirname(fileURLToPath(import.meta.url)), "../checks");
export const bundledConventionVersion = "8.0";
const profileManifest = { version: "8.0", profiles: {
  general: { profile: "general", document: "general.json", version: "8.0", extends: [] },
  application: { profile: "application", document: "application.json", version: "8.0", extends: ["general"] },
  cli: { profile: "cli", document: "cli.json", version: "8.0", extends: ["application"] },
  web: { profile: "web", document: "web.json", version: "8.0", extends: ["application"] },
  discord: { profile: "discord", document: "discord.json", version: "8.0", extends: ["application"] },
  "mcp-server": { profile: "mcp-server", document: "mcp-server.json", version: "8.0", extends: ["application"] },
  library: { profile: "library", document: "library.json", version: "8.0", extends: ["general"] },
  documentation: { profile: "documentation", document: "documentation.json", version: "8.0", extends: ["general"] },
  workspace: { profile: "workspace", document: "workspace.json", version: "8.0", extends: ["general"] },
  infrastructure: { profile: "infrastructure", document: "infrastructure.json", version: "8.0", extends: ["general"] },
  "npm-published": { profile: "npm-published", document: "npm-published.json", version: "8.0", extends: ["general"] },
  "ghcr-published": { profile: "ghcr-published", document: "ghcr-published.json", version: "8.0", extends: ["general"] },
  private: { profile: "private", document: "private.json", version: "8.0", extends: ["general"] },
  fork: { profile: "fork", document: "fork.json", version: "8.0", extends: [] },
} };

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
  for (const name of apply) {
    for (const parent of authority.profiles[name].extends) {
      if (!selected.has(parent)) return `Convention groups require applying: ${parent}.`;
    }
  }
  if (selected.has("fork") && selected.size !== 1) return "The fork convention group excludes all other convention groups.";
  return null;
}
