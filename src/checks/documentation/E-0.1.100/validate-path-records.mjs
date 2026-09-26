import { validateAuthorityReference } from "./validate-authority-reference.mjs";

export async function validatePathRecords({ root, file, records, label }) {
  if (!Array.isArray(records)) return `${label} must be an array.`;
  for (const [index, record] of records.entries()) {
    if (!record || typeof record !== "object" || typeof record.path !== "string") {
      return `${label}[${index}] must contain a path.`;
    }
    const error = await validateAuthorityReference({
      root,
      file,
      reference: record.path,
      label: `${label}[${index}]`,
    });
    if (error) return error;
  }
  return null;
}
