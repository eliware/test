import {
  contractFields,
  contractIdPattern,
  contractSections,
  directiveIdPattern,
  hasOwnValues,
} from "./contract-schema.mjs";
import { validateContractEvidence } from "./validate-contract-evidence.mjs";

export function validateContractRecordShape(contract, ids) {
  if (!contract || typeof contract !== "object" || !hasOwnValues(contract, contractFields)) {
    return "Every contract must contain the shared required fields.";
  }
  if (ids.has(contract.id) || !contractIdPattern.test(contract.id)) {
    return `Contract ID is missing, duplicated, or invalid: ${contract.id ?? "unknown"}.`;
  }
  ids.add(contract.id);
  if (
    !Array.isArray(contract.directiveIds) ||
    contract.directiveIds.some((id) => !directiveIdPattern.test(id))
  ) {
    return `Contract ${contract.id} has invalid directive references.`;
  }
  if (
    !contract.contract ||
    typeof contract.contract !== "object" ||
    !contractSections.every((section) => Object.hasOwn(contract.contract, section))
  ) {
    return `Contract ${contract.id} is missing a required behavior section.`;
  }
  return validateContractEvidence(contract);
}
