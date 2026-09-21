import { bundledDirectiveAuthority } from "./read-bundled-profile-authority.mjs";
import { createBundledCheckManifest } from "./create-bundled-check-manifest.mjs";

export function validateBundledDirectiveCompleteness(checks, groups, authority = bundledDirectiveAuthority) {
  if (authority.version !== "8.0" || !authority.profiles) throw new Error("Bundled directive authority is missing or invalid.");
  const manifest = createBundledCheckManifest(checks);
  const selectedProfiles = new Set(groups);
  const unknownProfiles = groups.filter((group) => !authority.profiles[group]);
  if (unknownProfiles.length) throw new Error(`Unknown bundled convention profiles: ${unknownProfiles.join(", ")}.`);
  const unregistered = manifest.checks
    .filter(({ enforcementMode, modulePath }) => enforcementMode === "deterministic"
      && selectedProfiles.has(modulePath.split("/")[0]))
    .filter(({ modulePath }) => !authority.profiles[modulePath.split("/")[0]]);
  if (unregistered.length) throw new Error(`Deterministic bundled checks have no authority entry: ${unregistered.join(", ")}.`);
  return true;
}
