import { validateAuthorityReference } from "./validate-authority-reference.mjs";
import { validatePathRecords } from "./validate-path-records.mjs";

export async function validateAuthorityRecordReferences({
  root,
  file,
  document,
  registeredRepositoryRoots = [],
}) {
  const failures = [];
  if (typeof document?.globalAuthorityMap === "string") {
    const globalMapError = await validateAuthorityReference({
      root,
      file,
      reference: document.globalAuthorityMap,
      label: "globalAuthorityMap",
      registeredRepositoryRoots,
    });
    if (globalMapError) failures.push(globalMapError);
  }
  for (const [index, subject] of (Array.isArray(document?.subjects)
    ? document.subjects
    : []
  ).entries()) {
    if (!subject || typeof subject !== "object") continue;
    const authorityError = await validateAuthorityReference({
      root,
      file,
      reference: subject.authority?.path,
      label: `authority subject ${subject.id ?? index}`,
      registeredRepositoryRoots,
    });
    if (authorityError) failures.push(authorityError);
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
      if (error) failures.push(error);
    }
  }
  return failures.length ? failures.join("\n") : null;
}
