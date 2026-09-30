import { readBundledProfileCatalog } from "./read-bundled-profile-catalog.mjs";

export function validateAppliedProfiles(apply, catalog = readBundledProfileCatalog()) {
  const unknown = apply.filter((name) => !catalog.profiles[name]);
  if (unknown.length > 0) return `Unknown convention group: ${unknown.join(", ")}.`;
  if (!apply.includes("general")) return "Every repository must explicitly apply general.";
  const dependencies = {
    cli: ["application"],
    discord: ["application"],
    "mcp-server": ["application"],
    web: ["application"],
    documentation: ["private"],
    workspace: ["private"],
    infrastructure: ["private"],
  };
  const missing = Object.entries(dependencies).flatMap(([profile, required]) =>
    apply.includes(profile) ? required.filter((name) => !apply.includes(name)) : [],
  );
  if (missing.length > 0)
    return `Applied profiles require explicit profiles: ${[...new Set(missing)].join(", ")}.`;
  return null;
}
