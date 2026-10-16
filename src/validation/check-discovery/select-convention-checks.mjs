import { discoverChecks } from "./discover/checks.mjs";

export async function selectConventionChecks(conventions, availableChecks = null) {
  const profiles = conventions.apply;
  const selected = new Set(profiles);
  const applicable = ({ modulePath, requiredProfiles = [] }) =>
    modulePath?.split("/")[0] === "shared"
      ? requiredProfiles.every((profile) => selected.has(profile))
      : selected.has(modulePath?.split("/")[0]);
  if (availableChecks) {
    return availableChecks.filter(applicable);
  }
  const checks = await discoverChecks([...profiles, "shared"]);
  return checks.filter(applicable);
}
