import { validateAuthorityReference } from "./validate-authority-reference.mjs";

export async function validatePathRecords({
  root,
  file,
  records,
  label,
  registeredRepositoryRoots = [],
}) {
  if (!Array.isArray(records)) return `${label} must be an array.`;
  const failures = [];
  for (const [index, record] of records.entries()) {
    if (!record || typeof record !== "object" || typeof record.path !== "string") {
      failures.push(`${label}[${index}] must contain a path.`);
      continue;
    }
    const error = await validateAuthorityReference({
      root,
      file,
      reference: record.path,
      label: `${label}[${index}]`,
      registeredRepositoryRoots,
    });
    if (error) failures.push(error);
  }
  return failures.length ? failures.join("\n") : null;
}
