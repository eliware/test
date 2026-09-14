export const contractIdPattern = /^C-\d+(?:\.\d+)*$/;
export const directiveIdPattern = /^[EA]-\d+(?:\.\d+)*$/;
export const topLevelFields = ["schemaVersion", "contractVersion", "kind", "description", "authority", "format", "contracts"];
export const contractFields = ["id", "title", "scope", "directiveIds", "dos", "donts", "contract", "implementation", "verification"];
export const contractSections = ["purpose", "inputs", "outputs", "errors", "ordering", "invariants", "boundaries"];

export function hasOwnValues(value, fields) {
  return Boolean(value && typeof value === "object") && fields.every((field) => Object.hasOwn(value, field));
}
