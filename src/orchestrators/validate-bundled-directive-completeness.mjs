import { bundledDirectiveAuthority } from "./read-bundled-profile-authority.mjs";
import { createBundledCheckManifest } from "./create-bundled-check-manifest.mjs";

export function validateBundledDirectiveCompleteness(checks, groups, authority = bundledDirectiveAuthority) {
  if (authority.version !== "8.0" || !authority.profiles) throw new Error("Bundled directive authority is missing or invalid.");
  const manifest = createBundledCheckManifest(checks);
  const records = new Map(manifest.checks.map((record) => [record.ruleId, record]));
  const expected = [...new Set(groups.flatMap((group) => authority.profiles[group] ?? []))]
    .filter((id) => records.get(id)?.enforcementMode !== "non-deterministic");
  const missing = expected.filter((id) => !records.has(id));
  if (missing.length) throw new Error(`Bundled deterministic directive checks are missing: ${missing.join(", ")}.`);
  const authorityIds = new Set(expected);
  const selectedProfiles = new Set(groups);
  const unregistered = manifest.checks
    .filter(({ enforcementMode, modulePath }) => enforcementMode === "deterministic"
      && selectedProfiles.has(modulePath.split("/")[0]))
    .map(({ ruleId }) => ruleId)
    .filter((id) => !authorityIds.has(id));
  if (unregistered.length) throw new Error(`Deterministic bundled checks have no authority entry: ${unregistered.join(", ")}.`);
  return true;
}
