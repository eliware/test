import { readFileSync } from "node:fs";
import { readProfileDocuments } from "./read-profile-documents.mjs";
import { buildProfileAuthority } from "./build-profile-authority.mjs";

const packageJson = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);
export const bundledConventionVersion = packageJson.version.split(".").slice(0, 2).join(".");
const localProfileDocuments = readProfileDocuments(
  new URL("../../specs/conventions/", import.meta.url),
);
export const bundledDirectiveAuthority = buildProfileAuthority(
  localProfileDocuments,
  bundledConventionVersion,
);

export function readBundledProfileAuthority({ documents = localProfileDocuments } = {}) {
  return documents === localProfileDocuments
    ? bundledDirectiveAuthority
    : buildProfileAuthority(documents, bundledConventionVersion);
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
