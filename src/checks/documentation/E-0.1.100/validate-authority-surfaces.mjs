import { validateAuthorityDocuments } from "./validate-authority-documents.mjs";

export function validateAuthoritySurfaces(root, files, inventory) {
  return validateAuthorityDocuments(root, files, inventory);
}
