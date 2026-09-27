import { validateAuthorityReference } from "./validate-authority-reference.mjs";
import { validatePathRecords } from "./validate-path-records.mjs";

export async function validateAuthorityRecordReferences({
  root,
  file,
  document,
  registeredRepositoryRoots = [],
}) {
  const globalMapError = await validateAuthorityReference({
    root,
    file,
    reference: document.globalAuthorityMap,
    label: "globalAuthorityMap",
    registeredRepositoryRoots,
  });
  if (globalMapError) return globalMapError;
  for (const subject of document.subjects) {
    const authorityError = await validateAuthorityReference({
      root,
      file,
      reference: subject.authority.path,
      label: `authority subject ${subject.id}`,
      registeredRepositoryRoots,
    });
    if (authorityError) return authorityError;
    for (const [field, records] of Object.entries(subject).filter(([key]) =>
      ["directives", "implementation", "evidence"].includes(key),
    )) {
      const error = await validatePathRecords({
        root,
        file,
        records,
        label: `authority subject ${subject.id}.${field}`,
        registeredRepositoryRoots,
      });
      if (error) return error;
    }
  }
  return null;
}
