import { readFileSync } from "node:fs";
import { readProfileDocuments } from "./read-profile-documents.mjs";
import { buildProfileCatalog } from "./build-profile-catalog.mjs";

const packageJson = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);
export const bundledConventionVersion = packageJson.version.split(".").slice(0, 2).join(".");
const localProfileDocuments = readProfileDocuments(
  new URL("../../specs/conventions/", import.meta.url),
);
export const bundledProfileCatalog = buildProfileCatalog(
  localProfileDocuments,
  bundledConventionVersion,
);

export function readBundledProfileCatalog({ documents = localProfileDocuments } = {}) {
  return documents === localProfileDocuments
    ? bundledProfileCatalog
    : buildProfileCatalog(documents, bundledConventionVersion);
}
