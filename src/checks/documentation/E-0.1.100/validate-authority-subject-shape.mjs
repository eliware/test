const supportedKinds = new Set([
  "directive",
  "specification",
  "workflow",
  "runbook",
  "index",
  "schema",
  "module-area",
  "record",
  "desired-state",
  "test-suite",
]);

export function validateAuthoritySubjectShape(subject, index, subjectIds, authorityTargets) {
  if (!subject || typeof subject !== "object" || typeof subject.id !== "string")
    return [`authority subject ${index} must declare an id.`];
  const failures = [];
  if (!subject.authority || typeof subject.authority.path !== "string")
    failures.push(`authority subject ${subject.id} must declare an authority path.`);
  if (subjectIds.has(subject.id)) failures.push(`authority subject ${subject.id} is duplicated.`);
  subjectIds.add(subject.id);
  if (typeof subject.authority?.path === "string") {
    const target = `${subject.authority.path}#${subject.authority.anchor ?? ""}`;
    if (authorityTargets.has(target))
      failures.push(`authority subject ${subject.id} duplicates normative target ${target}.`);
    authorityTargets.add(target);
  }
  for (const field of ["directives", "implementation", "evidence"]) {
    const records = subject[field];
    if (!Array.isArray(records)) {
      failures.push(`authority subject ${subject.id}.${field} must be an array.`);
      continue;
    }
    for (const [recordIndex, record] of records.entries()) {
      if (!record || typeof record !== "object" || typeof record.path !== "string")
        failures.push(
          `authority subject ${subject.id}.${field}[${recordIndex}] must contain a path.`,
        );
    }
  }
  if (typeof subject.kind !== "string" || !supportedKinds.has(subject.kind))
    failures.push(`authority subject ${subject.id} must declare a supported kind.`);
  if (Array.isArray(subject.directives) && subject.directives.length === 0)
    failures.push(`authority subject ${subject.id}.directives must be a nonempty array.`);
  if (Array.isArray(subject.implementation) && subject.implementation.length === 0)
    failures.push(`authority subject ${subject.id}.implementation must be a nonempty array.`);
  for (const field of ["consumers", "reviewers"]) {
    if (!Array.isArray(subject[field]))
      failures.push(`authority subject ${subject.id}.${field} must be an array.`);
  }
  if (!["active", "proposed", "deprecated", "superseded"].includes(subject.status))
    failures.push(`authority subject ${subject.id} must declare a supported status.`);
  return failures;
}
