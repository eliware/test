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
  const unknownProfiles = groups.filter((group) => group !== "shared" && !catalog.profiles[group]);
  if (unknownProfiles.length)
    throw new Error(`Unknown bundled convention profiles: ${unknownProfiles.join(", ")}.`);
  const unregistered = manifest.checks.filter(({ ruleId, modulePath }) => {
    const group = modulePath.split("/")[0];
    const profile =
      group === "shared" ? checks.find((check) => check.ruleId === ruleId)?.ownerProfile : group;
    const requiredProfiles = checks.find((check) => check.ruleId === ruleId)?.requiredProfiles;
    const filename = modulePath
      .split("/")
      .at(-1)
      ?.replace(/\.mjs$/u, "");
    return (
      !catalog.profiles[profile] ||
      (group === "shared" &&
        (!Array.isArray(requiredProfiles) ||
          requiredProfiles.length === 0 ||
          requiredProfiles.some((name) => !catalog.profiles[name]) ||
          !requiredProfiles.includes("general") ||
          !requiredProfiles.includes(profile))) ||
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
