import { validateAuthorityDocuments } from "./validate-authority-documents.mjs";

export function validateAuthoritySurfaces(root, files) {
  return validateAuthorityDocuments(root, files);
}
