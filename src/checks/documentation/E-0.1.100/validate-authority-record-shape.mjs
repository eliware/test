import { validateAuthoritySubjectShape } from "./validate-authority-subject-shape.mjs";

export function validateAuthorityRecordShape(document) {
  if (!document || typeof document !== "object" || !Array.isArray(document.subjects)) {
    return "authority.json must declare a subjects array.";
  }
  if (typeof document.repositoryId !== "string" || !document.repositoryId) {
    return "authority.json must declare repositoryId.";
  }
  if (typeof document.globalAuthorityMap !== "string") {
    return "authority.json must declare globalAuthorityMap.";
  }
  const subjectIds = new Set();
  const authorityTargets = new Set();
  const failures = [];
  for (const [index, subject] of document.subjects.entries()) {
    failures.push(...validateAuthoritySubjectShape(subject, index, subjectIds, authorityTargets));
  }
  return failures.length ? failures.join("\n") : null;
}
