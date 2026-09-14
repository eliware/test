import { hasOwnValues, topLevelFields } from "./contract-schema.mjs";

export function validateContractDocumentShape(document) {
  if (!hasOwnValues(document, topLevelFields) || document.kind !== "contract-reference") {
    return "specs/contracts.json must use the shared contract-reference top-level format.";
  }
  if (!Array.isArray(document.contracts) || document.contracts.length === 0) {
    return "specs/contracts.json must declare at least one contract.";
  }
  return null;
}
