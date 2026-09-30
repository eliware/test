import { readBundledProfileCatalog } from "./read-bundled-profile-catalog.mjs";

export function validateAppliedProfiles(apply, catalog = readBundledProfileCatalog()) {
  const unknown = apply.filter((name) => !catalog.profiles[name]);
  if (unknown.length > 0) return `Unknown convention group: ${unknown.join(", ")}.`;
  const privateRequired = ["documentation", "workspace", "infrastructure"];
  if (privateRequired.some((name) => apply.includes(name)) && !apply.includes("private"))
    return "Documentation, workspace, and infrastructure convention profiles require private.";
  return null;
}
