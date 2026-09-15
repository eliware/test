import { hasOwnValues, topLevelFields } from "./contract-schema.mjs";

export function validateContractDocumentShape(document) {
  if (!hasOwnValues(document, topLevelFields) || document.kind !== "contract-reference") {
    return "specs/contracts.json must use the shared contract-reference top-level format.";
  }
  if (document.schemaVersion !== "1.0" || document.contractVersion !== "8.0") {
    return "specs/contracts.json must use schemaVersion 1.0 and contractVersion 8.0.";
  }
  if (typeof document.description !== "string" || !document.description.trim()) {
    return "specs/contracts.json must contain a nonempty description.";
  }
  if (!document.authority || typeof document.authority !== "object" || Array.isArray(document.authority)) {
    return "specs/contracts.json authority must be an object.";
  }
  if (!document.format || typeof document.format !== "object" || Array.isArray(document.format)) {
    return "specs/contracts.json format must be an object.";
  }
  if (!Array.isArray(document.contracts) || document.contracts.length === 0) {
    return "specs/contracts.json must declare at least one contract.";
  }
  return null;
}
