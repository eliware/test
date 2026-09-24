import conventionRemediation from "../../specs/convention-remediation.json" with { type: "json" };

export const bundledConventionVersion = "8.0";

function authorityFromSnapshot(snapshot) {
  if (snapshot.version !== bundledConventionVersion || !snapshot.checks) {
    throw new Error("Bundled convention authority snapshot is missing or invalid.");
  }
  const profiles = {};
  const directives = {};
  for (const [ruleId, record] of Object.entries(snapshot.checks)) {
    if (typeof record?.source !== "string" || !record.source.endsWith(".json")) {
      throw new Error(`Bundled directive ${ruleId} has no valid source profile.`);
    }
    const profile = record.source.slice(0, -".json".length);
    if (!/^[a-z0-9-]+$/u.test(profile)) {
      throw new Error(`Bundled directive ${ruleId} has an invalid source profile.`);
    }
    profiles[profile] = { profile };
    directives[ruleId] = profile;
  }
  if (Object.keys(profiles).length === 0) {
    throw new Error("Bundled convention profile authority cannot be empty.");
  }
  return { version: snapshot.version, profiles, directives };
}

export const bundledDirectiveAuthority = authorityFromSnapshot(conventionRemediation);

export function readBundledProfileAuthority({ snapshot = conventionRemediation } = {}) {
  return authorityFromSnapshot(snapshot);
}

export function validateAppliedProfiles(apply, authority = readBundledProfileAuthority()) {
  const selected = new Set(apply);
  const unknown = apply.filter((name) => !authority.profiles[name]);
  if (unknown.length > 0) return `Unknown convention group: ${unknown.join(", ")}.`;
  if (selected.has("fork") && selected.size !== 1)
    return "The fork convention group excludes all other convention groups.";
  return null;
}

export function expandAppliedProfiles(apply, authority = readBundledProfileAuthority()) {
  const seen = new Set();
  return apply.filter((name) => authority.profiles[name] && !seen.has(name) && seen.add(name));
}
