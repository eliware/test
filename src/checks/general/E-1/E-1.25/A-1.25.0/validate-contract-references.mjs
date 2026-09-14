import { validateStructuredReference } from "./resolve-structured-reference.mjs";

const evidenceReferences = [
  ["implementation", "source"],
  ["verification", "tests"],
];

export async function validateContractReferences({ root, file, contract }) {
  for (const [section, field] of evidenceReferences) {
    const evidence = contract[section];
    if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
      return `Contract ${contract.id} ${section} evidence must be an object.`;
    }
    if (!Object.hasOwn(evidence, field)) continue;
    if (
      !Array.isArray(evidence[field]) ||
      evidence[field].some((value) => typeof value !== "string")
    ) {
      return `Contract ${contract.id} ${section}.${field} references must be an array of paths.`;
    }
    for (const value of evidence[field]) {
      const normalized = value.replaceAll("\\", "/").replace(/^\.\//u, "");
      if (
        (field === "source" && !/^(?:src|bin|specs)(?:\/|$)/u.test(normalized)) ||
        (field === "tests" && !/^tests(?:\/|$)/u.test(normalized))
      ) {
        return `Contract ${contract.id} ${section}.${field} reference ${value} must point into the ${field === "source" ? "src/, bin/, or specs/" : "tests/"} tree`;
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
  return null;
}
