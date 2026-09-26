import { validateAuthorityReference } from "./validate-authority-reference.mjs";
import { validatePathRecords } from "./validate-path-records.mjs";

export async function validateAuthorityRecordReferences({ root, file, document }) {
  const globalMapError = await validateAuthorityReference({
    root,
    file,
    reference: document.globalAuthorityMap,
    label: "globalAuthorityMap",
  });
  if (globalMapError) return globalMapError;
  for (const subject of document.subjects) {
    const authorityError = await validateAuthorityReference({
      root,
      file,
      reference: subject.authority.path,
      label: `authority subject ${subject.id}`,
    });
    if (authorityError) return authorityError;
    for (const [field, records] of Object.entries(subject).filter(([key]) => ["directives", "implementation", "evidence"].includes(key))) {
      const error = await validatePathRecords({
        root,
        file,
        records,
        label: `authority subject ${subject.id}.${field}`,
      });
      if (error) return error;
    }
  }
  return null;
}
