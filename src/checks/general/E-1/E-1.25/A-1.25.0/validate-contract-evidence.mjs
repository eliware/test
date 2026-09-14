export function validateContractEvidence(contract) {
  for (const section of ["implementation", "verification"]) {
    if (!contract?.[section] || typeof contract[section] !== "object" || Array.isArray(contract[section])) {
      return `Contract ${contract.id} ${section} evidence must be an object.`;
    }
    for (const [field, values] of Object.entries(contract[section])) {
      if (!Array.isArray(values) || values.length === 0 || values.some((value) => typeof value !== "string" || !value.trim())) {
        return `Contract ${contract.id} ${section}.${field} evidence must be a nonempty string array.`;
      }
    }
  }
  if (!Array.isArray(contract.implementation?.source) || contract.implementation.source.length === 0 || !Array.isArray(contract.verification?.tests) || contract.verification.tests.length === 0) {
    return `Contract ${contract.id} must declare implementation source and verification tests.`;
  }
  return null;
}
