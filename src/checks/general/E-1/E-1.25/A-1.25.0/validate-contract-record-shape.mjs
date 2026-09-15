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
  if (typeof contract.title !== "string" || !contract.title.trim() || typeof contract.scope !== "string" || !contract.scope.trim()) {
    return `Contract ${contract.id} must have nonempty title and scope.`;
  }
  for (const field of ["dos", "donts"]) {
    if (!Array.isArray(contract[field]) || contract[field].length === 0 || contract[field].some((value) => typeof value !== "string" || !value.trim())) {
      return `Contract ${contract.id} ${field} must be a nonempty string array.`;
    }
  }
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
  for (const section of contractSections) {
    const value = contract.contract[section];
    if (Array.isArray(value) && (value.length === 0 || value.some((entry) => typeof entry !== "string" || !entry.trim()))) {
      return `Contract ${contract.id} contract.${section} must not be empty.`;
    }
    if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) {
      return `Contract ${contract.id} contract.${section} must not be empty.`;
    }
    if (typeof value === "string" && !value.trim()) return `Contract ${contract.id} contract.${section} must not be empty.`;
  }
  return validateContractEvidence(contract);
}
