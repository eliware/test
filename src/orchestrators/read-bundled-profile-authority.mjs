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
