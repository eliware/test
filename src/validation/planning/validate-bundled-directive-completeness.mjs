import {
  bundledConventionVersion,
  bundledProfileCatalog,
} from "../check-discovery/read-bundled-profile-catalog.mjs";
import { createBundledCheckManifest } from "../check-discovery/create-bundled-check-manifest.mjs";

export function validateBundledDirectiveCompleteness(
  checks,
  groups,
  catalog = bundledProfileCatalog,
) {
  if (
    catalog.version !== bundledConventionVersion ||
    !catalog.profiles ||
    !catalog.directives ||
    !catalog.rules
  )
    throw new Error("Bundled directive catalog is missing or invalid.");
  const manifest = createBundledCheckManifest(checks);
  const unknownProfiles = groups.filter((group) => !catalog.profiles[group]);
  if (unknownProfiles.length)
    throw new Error(`Unknown bundled convention profiles: ${unknownProfiles.join(", ")}.`);
  const unregistered = manifest.checks.filter(({ ruleId, modulePath }) => {
    const profile = modulePath.split("/")[0];
    const filename = modulePath
      .split("/")
      .at(-1)
      ?.replace(/\.mjs$/u, "");
    return (
      !catalog.profiles[profile] ||
      filename !== ruleId ||
      catalog.directives[ruleId] !== profile ||
      !catalog.rules[ruleId]
    );
  });
  if (unregistered.length)
    throw new Error(
      `Bundled checks have no matching catalog entry: ${unregistered
        .map(({ ruleId, modulePath }) => `${modulePath} (${ruleId})`)
        .join(", ")}.`,
    );
  return true;
}
