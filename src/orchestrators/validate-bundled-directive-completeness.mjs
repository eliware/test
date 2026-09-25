import {
  bundledConventionVersion,
  bundledDirectiveAuthority,
} from "./read-bundled-profile-authority.mjs";
import { createBundledCheckManifest } from "./create-bundled-check-manifest.mjs";

export function validateBundledDirectiveCompleteness(
  checks,
  groups,
  authority = bundledDirectiveAuthority,
) {
  if (
    authority.version !== bundledConventionVersion ||
    !authority.profiles ||
    !authority.directives ||
    !authority.rules
  )
    throw new Error("Bundled directive authority is missing or invalid.");
  const manifest = createBundledCheckManifest(checks);
  const unknownProfiles = groups.filter((group) => !authority.profiles[group]);
  if (unknownProfiles.length)
    throw new Error(`Unknown bundled convention profiles: ${unknownProfiles.join(", ")}.`);
  const unregistered = manifest.checks.filter(({ ruleId, modulePath }) => {
    const profile = modulePath.split("/")[0];
    const filename = modulePath
      .split("/")
      .at(-1)
      ?.replace(/\.mjs$/u, "");
    return (
      !authority.profiles[profile] ||
      filename !== ruleId ||
      authority.directives[ruleId] !== profile ||
      !authority.rules[ruleId]
    );
  });
  if (unregistered.length)
    throw new Error(
      `Bundled checks have no matching authority entry: ${unregistered
        .map(({ ruleId, modulePath }) => `${modulePath} (${ruleId})`)
        .join(", ")}.`,
    );
  return true;
}
