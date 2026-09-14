import { validateStructuredReference } from "./resolve-structured-reference.mjs";

const pathFields = new Set(["source", "tests", "files", "documents", "references", "artifacts"]);

function isPathField(field) {
  return pathFields.has(field) || field.endsWith("Paths") || field.endsWith("Files");
}

export async function validateContractReferences({ root, file, contract }) {
  for (const section of ["implementation", "verification"]) {
    const evidence = contract[section];
    if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
      return `Contract ${contract.id} ${section} evidence must be an object.`;
    }
    for (const [field, values] of Object.entries(evidence)) {
      if (!Array.isArray(values) || values.some((value) => typeof value !== "string" || !value.trim())) {
        return `Contract ${contract.id} ${section}.${field} evidence must be a nonempty string array.`;
      }
      if (!isPathField(field)) continue;
      for (const value of values) {
      const normalized = value.replaceAll("\\", "/").replace(/^\.\//u, "");
      if (
        (field === "source" && !/^(?:src|bin|specs)(?:\/|$)/u.test(normalized)) ||
        (field === "tests" && !/^tests(?:\/|$)/u.test(normalized)) ||
        (field !== "source" && field !== "tests" && !/^(?:src|bin|specs|tests|docs|examples)(?:\/|$)/u.test(normalized))
      ) {
        return `Contract ${contract.id} ${section}.${field} reference ${value} must point into an approved repository tree`;
      }
      const error = await validateStructuredReference({
        root,
        file,
        field: `${section}.${field}`,
        value,
      });
      if (error) return `Contract ${contract.id} ${section}.${field} reference ${value} ${error}.`;
      }
    }
  }
  return null;
}
