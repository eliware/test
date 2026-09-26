const supportedKinds = new Set([
  "directive", "specification", "workflow", "runbook", "index", "schema", "module-area", "record", "desired-state", "test-suite",
]);

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
  for (const [index, subject] of document.subjects.entries()) {
    if (!subject || typeof subject !== "object" || typeof subject.id !== "string") {
      return `authority subject ${index} must declare an id.`;
    }
    if (!subject.authority || typeof subject.authority.path !== "string") {
      return `authority subject ${subject.id} must declare an authority path.`;
    }
    if (subjectIds.has(subject.id)) return `authority subject ${subject.id} is duplicated.`;
    subjectIds.add(subject.id);
    const target = `${subject.authority.path}#${subject.authority.anchor ?? ""}`;
    if (authorityTargets.has(target)) return `authority subject ${subject.id} duplicates normative target ${target}.`;
    authorityTargets.add(target);
    for (const [field, records] of Object.entries(subject).filter(([key]) => ["directives", "implementation", "evidence"].includes(key))) {
      if (!Array.isArray(records)) return `authority subject ${subject.id}.${field} must be an array.`;
      for (const [recordIndex, record] of records.entries()) {
        if (!record || typeof record !== "object" || typeof record.path !== "string") {
          return `authority subject ${subject.id}.${field}[${recordIndex}] must contain a path.`;
        }
      }
    }
    if (typeof subject.kind !== "string" || !supportedKinds.has(subject.kind)) {
      return `authority subject ${subject.id} must declare a supported kind.`;
    }
    if (!Array.isArray(subject.directives)) return `authority subject ${subject.id}.directives must be an array.`;
    if (subject.directives.length === 0) return `authority subject ${subject.id}.directives must be a nonempty array.`;
    if (!Array.isArray(subject.implementation) || subject.implementation.length === 0) {
      return `authority subject ${subject.id}.implementation must be a nonempty array.`;
    }
    for (const field of ["consumers", "reviewers", "evidence"]) {
      if (!Array.isArray(subject[field])) return `authority subject ${subject.id}.${field} must be an array.`;
    }
    if (!["active", "proposed", "deprecated", "superseded"].includes(subject.status)) {
      return `authority subject ${subject.id} must declare a supported status.`;
    }
  }
  return null;
}
